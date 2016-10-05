// Copyright 2016 CoreOS, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package cluster

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/embed"
	pb "github.com/coreos/etcd/etcdserver/etcdserverpb"
	"github.com/coreos/etcd/pkg/transport"

	humanize "github.com/dustin/go-humanize"
	"github.com/gyuho/db/pkg/types"
)

const (
	// StoppedNodeStatus is node status before start or after stop.
	StoppedNodeStatus = "Stopped"
	// FollowerNodeStatus is follower in Raft.
	FollowerNodeStatus = "Follower"
	// LeaderNodeStatus is leader in Raft.
	LeaderNodeStatus = "Leader"
)

// NodeStatus defines node status information.
// Encode without json tag to make it parsable by Typescript.
type NodeStatus struct {
	Name     string
	ID       string
	Endpoint string

	IsLeader bool
	State    string
	StateTxt string

	DBSize    uint64
	DBSizeTxt string
	Hash      int
}

// node contains *embed.Etcd and its state.
type node struct {
	srv              *embed.Etcd
	cfg              *embed.Config
	stoppedStartedAt time.Time

	statusLock sync.RWMutex
	status     NodeStatus
}

// Cluster contains all embedded etcd nodes in the same cluster.
// Configuration is meant to be auto-generated.
type Cluster struct {
	Started time.Time

	// opLock blocks Stop, Restart, Shutdown.
	opLock sync.Mutex

	rootDir           string
	size              int
	stopStartInterval time.Duration
	nodes             []*node

	stopc chan struct{} // to signal updateNodeStatus
	donec chan struct{} // after stopping updateNodeStatus
}

// Config defines etcd local cluster Configuration.
type Config struct {
	Size     int
	RootDir  string
	RootPort int

	ClientTLSInfo transport.TLSInfo
	ClientAutoTLS bool
	PeerTLSInfo   transport.TLSInfo
	PeerAutoTLS   bool

	// StopStartInterval is the minimum duration to allow updates on nodes.
	// This is to rate limit the nodes stop and restart operations.
	StopStartInterval time.Duration
}

var (
	uptimeScale          = time.Second
	minStopStartInterval = 2 * time.Second
)

// Start starts embedded etcd cluster.
func Start(ccfg Config) (c *Cluster, err error) {
	plog.Printf("starting %d nodes (root directory %s, root port :%d)", ccfg.Size, ccfg.RootDir, ccfg.RootPort)

	startTime := time.Now().Round(uptimeScale)
	if ccfg.StopStartInterval < minStopStartInterval {
		ccfg.StopStartInterval = minStopStartInterval
	}

	c = &Cluster{
		Started:           startTime,
		rootDir:           ccfg.RootDir,
		size:              ccfg.Size,
		stopStartInterval: ccfg.StopStartInterval,
		nodes:             make([]*node, ccfg.Size),
		stopc:             make(chan struct{}),
		donec:             make(chan struct{}),
	}

	if !existFileOrDir(ccfg.RootDir) {
		if err = mkdirAll(ccfg.RootDir); err != nil {
			return nil, err
		}
	}

	// client TLS
	if !ccfg.ClientTLSInfo.Empty() && ccfg.ClientAutoTLS {
		return nil, fmt.Errorf("choose either auto TLS or manual client TLS")
	}
	clientScheme := "https"
	if ccfg.ClientTLSInfo.Empty() && !ccfg.ClientAutoTLS {
		clientScheme = "http"
	}

	// peer TLS
	if !ccfg.PeerTLSInfo.Empty() && ccfg.PeerAutoTLS {
		return nil, fmt.Errorf("choose either auto TLS or manual peer TLS")
	}
	peerScheme := "https"
	if ccfg.PeerTLSInfo.Empty() && !ccfg.PeerAutoTLS {
		peerScheme = "http"
	}

	startPort := ccfg.RootPort
	for i := 0; i < ccfg.Size; i++ {
		cfg := embed.NewConfig()

		cfg.Name = fmt.Sprintf("node%d", i+1)
		cfg.Dir = filepath.Join(ccfg.RootDir, cfg.Name+".etcd")
		cfg.WalDir = filepath.Join(cfg.Dir, "wal")

		clientURL := url.URL{Scheme: clientScheme, Host: fmt.Sprintf("localhost:%d", startPort)}
		cfg.LCUrls, cfg.ACUrls = []url.URL{clientURL}, []url.URL{clientURL}

		peerURL := url.URL{Scheme: peerScheme, Host: fmt.Sprintf("localhost:%d", startPort+1)}
		cfg.LPUrls, cfg.APUrls = []url.URL{peerURL}, []url.URL{peerURL}

		cfg.ClientAutoTLS = ccfg.ClientAutoTLS
		cfg.ClientTLSInfo = ccfg.ClientTLSInfo
		cfg.PeerAutoTLS = ccfg.PeerAutoTLS
		cfg.PeerTLSInfo = ccfg.PeerTLSInfo

		c.nodes[i] = &node{cfg: cfg, status: NodeStatus{Name: cfg.Name, Endpoint: clientURL.String(), IsLeader: false, State: StoppedNodeStatus}}

		startPort += 2
	}

	inits := make([]string, ccfg.Size)
	for i := 0; i < ccfg.Size; i++ {
		inits[i] = c.nodes[i].cfg.Name + "=" + c.nodes[i].cfg.APUrls[0].String()
	}
	ic := strings.Join(inits, ",")

	for i := 0; i < ccfg.Size; i++ {
		c.nodes[i].cfg.InitialCluster = ic

		// start server
		var srv *embed.Etcd
		srv, err = embed.StartEtcd(c.nodes[i].cfg)
		if err != nil {
			return nil, err
		}
		c.nodes[i].srv = srv

		// copy and overwrite with internal configuration
		// in case it was configured with auto TLS
		nc := c.nodes[i].srv.Config()
		c.nodes[i].cfg = &nc
	}

	var wg sync.WaitGroup
	wg.Add(c.size)
	for i := 0; i < c.size; i++ {
		go func(i int) {
			defer wg.Done()

			<-c.nodes[i].srv.Server.ReadyNotify()

			c.nodes[i].stoppedStartedAt = time.Now()
			c.nodes[i].status.State = FollowerNodeStatus
			c.nodes[i].status.StateTxt = fmt.Sprintf("%s just started (%s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt))
			c.nodes[i].status.IsLeader = false

			plog.Printf("started %s (client %s, peer %s)", c.nodes[i].cfg.Name, c.nodes[i].cfg.LCUrls[0].String(), c.nodes[i].cfg.LPUrls[0].String())
		}(i)
	}
	wg.Wait()

	time.Sleep(time.Second)

	plog.Print("checking leader")
	errc := make(chan error)
	for i := 0; i < c.size; i++ {
		go func(i int) {
			for {
				cli, _, err := c.Client(i, false, false, 3*time.Second)
				if err != nil {
					plog.Warning(err)
					continue
				}
				defer cli.Close()

				ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
				resp, err := cli.Status(ctx, c.nodes[i].cfg.LCUrls[0].Host)
				cancel()
				if err != nil {
					plog.Warning(err)
					continue
				}

				c.nodes[i].status.ID = types.ID(resp.Header.MemberId).String()

				if resp.Leader == uint64(0) {
					plog.Printf("%s %s has no leader yet", c.nodes[i].cfg.Name, types.ID(resp.Header.MemberId))
					c.nodes[i].status.IsLeader = false
					c.nodes[i].status.State = FollowerNodeStatus

					time.Sleep(time.Second)
					continue
				}

				plog.Printf("%s %s has leader %s", c.nodes[i].cfg.Name, types.ID(resp.Header.MemberId), types.ID(resp.Leader))
				c.nodes[i].status.IsLeader = resp.Leader == resp.Header.MemberId
				if c.nodes[i].status.IsLeader {
					c.nodes[i].status.State = LeaderNodeStatus
				} else {
					c.nodes[i].status.State = FollowerNodeStatus
				}

				break
			}

			errc <- nil
		}(i)
	}

	cn := 0
	for err := range errc {
		if err != nil {
			plog.Warning(err)
			return nil, err
		}

		cn++
		if cn == c.size {
			close(errc)
		}
	}

	defer func() {
		// update once at first
		c.updateNodeStatus()

		go func() {
			for {
				select {
				case <-c.stopc:
					plog.Println("exiting updateNodeStatus loop")
					close(c.donec)
					return

				case <-time.After(time.Second):
					c.updateNodeStatus()
				}
			}
		}()
	}()

	plog.Printf("successfully started %d nodes", ccfg.Size)
	return c, nil
}

// StopNotify returns receive-only stop channel to notify the cluster has stopped.
func (c *Cluster) StopNotify() <-chan struct{} {
	return c.stopc
}

// Stop stops a node.
func (c *Cluster) Stop(i int) {
	c.opLock.Lock()
	defer c.opLock.Unlock()

	plog.Printf("stopping %s", c.nodes[i].cfg.Name)

	c.nodes[i].statusLock.RLock()
	if c.nodes[i].status.State == StoppedNodeStatus {
		plog.Warningf("%s is already stopped", c.nodes[i].cfg.Name)
		c.nodes[i].statusLock.RUnlock()
		return
	}
	c.nodes[i].statusLock.RUnlock()

	for {
		it := time.Since(c.nodes[i].stoppedStartedAt)
		if it > c.stopStartInterval {
			break
		}

		more := c.stopStartInterval - it + 100*time.Millisecond
		plog.Printf("rate-limiting stopping %s (sleeping %v)", c.nodes[i].cfg.Name, more)

		time.Sleep(more)
	}
	c.nodes[i].stoppedStartedAt = time.Now()

	c.nodes[i].statusLock.Lock()
	c.nodes[i].status.IsLeader = false
	c.nodes[i].status.State = StoppedNodeStatus
	c.nodes[i].status.StateTxt = fmt.Sprintf("%s just stopped (%s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt))
	c.nodes[i].status.DBSize = 0
	c.nodes[i].status.DBSizeTxt = ""
	c.nodes[i].status.Hash = 0
	c.nodes[i].statusLock.Unlock()

	c.nodes[i].srv.Server.HardStop()
	c.nodes[i].srv.Close()
	<-c.nodes[i].srv.Err()

	plog.Printf("stopped %s", c.nodes[i].cfg.Name)
}

// Restart restarts a node.
func (c *Cluster) Restart(i int) error {
	c.opLock.Lock()
	defer c.opLock.Unlock()

	plog.Printf("restarting %s", c.nodes[i].cfg.Name)

	c.nodes[i].statusLock.RLock()
	if c.nodes[i].status.State != StoppedNodeStatus {
		plog.Warningf("%s is already started", c.nodes[i].cfg.Name)
		c.nodes[i].statusLock.RUnlock()
		return nil
	}
	c.nodes[i].statusLock.RUnlock()

	for {
		it := time.Since(c.nodes[i].stoppedStartedAt)
		if it > c.stopStartInterval {
			break
		}

		more := c.stopStartInterval - it + 100*time.Millisecond
		plog.Printf("rate-limiting restarting %s (sleeping %v)", c.nodes[i].cfg.Name, more)

		time.Sleep(more)
	}

	c.nodes[i].cfg.ClusterState = "existing"

	// start server
	srv, err := embed.StartEtcd(c.nodes[i].cfg)
	if err != nil {
		return err
	}
	c.nodes[i].srv = srv

	nc := c.nodes[i].srv.Config()
	c.nodes[i].cfg = &nc

	<-c.nodes[i].srv.Server.ReadyNotify()
	c.nodes[i].stoppedStartedAt = time.Now()

	c.nodes[i].statusLock.Lock()
	c.nodes[i].status.IsLeader = false
	c.nodes[i].status.State = FollowerNodeStatus
	c.nodes[i].status.StateTxt = fmt.Sprintf("%s just restarted (%s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt))
	c.nodes[i].statusLock.Unlock()

	plog.Printf("restarted %s", c.nodes[i].cfg.Name)
	return nil
}

// Shutdown stops all nodes and deletes all data directories.
func (c *Cluster) Shutdown() {
	close(c.stopc) // stopping updateNodeStatus
	<-c.donec      // wait until it returns

	c.opLock.Lock()
	defer c.opLock.Unlock()

	plog.Println("shutting down all nodes")
	var wg sync.WaitGroup
	wg.Add(c.size)
	for i := 0; i < c.size; i++ {
		go func(i int) {
			defer wg.Done()

			if c.nodes[i].status.State == StoppedNodeStatus {
				plog.Warningf("%s is already stopped", c.nodes[i].cfg.Name)
				return
			}
			c.nodes[i].stoppedStartedAt = time.Now()

			c.nodes[i].status.IsLeader = false
			c.nodes[i].status.State = StoppedNodeStatus
			c.nodes[i].status.State = fmt.Sprintf("%s just stopped (%s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt))
			c.nodes[i].status.DBSize = 0
			c.nodes[i].status.DBSizeTxt = ""
			c.nodes[i].status.Hash = 0

			c.nodes[i].srv.Server.HardStop()
			c.nodes[i].srv.Close()
			<-c.nodes[i].srv.Err()
		}(i)
	}
	wg.Wait()

	os.RemoveAll(c.rootDir)
	plog.Printf("successfully shutdown cluster (deleted %s)", c.rootDir)
}

func (c *Cluster) updateNodeStatus() {
	errc := make(chan error)
	for i := 0; i < c.size; i++ {
		go func(i int) {
			if c.nodes[i] == nil {
				errc <- fmt.Errorf("c.nodes[%d] is nil", i)
				return
			}

			if c.nodes[i].status.State == StoppedNodeStatus {
				c.nodes[i].status.StateTxt = fmt.Sprintf("%s has been stopped (since %s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt))
				plog.Printf("%s has been stopped (skipping updateNodeStatus)", c.nodes[i].cfg.Name)
				return
			}

			now := time.Now()
			cli, tlsConfig, err := c.Client(i, false, false, 3*time.Second)
			if err != nil {
				c.nodes[i].statusLock.Lock()
				c.nodes[i].status.State = StoppedNodeStatus
				c.nodes[i].status.StateTxt = fmt.Sprintf("%s was not reachable while client call (%s)", c.nodes[i].status.Name, humanize.Time(now))
				c.nodes[i].status.IsLeader = false
				c.nodes[i].status.DBSize = 0
				c.nodes[i].status.DBSizeTxt = ""
				c.nodes[i].status.Hash = 0
				c.nodes[i].statusLock.Unlock()

				errc <- err
				return
			}
			defer cli.Close()

			now = time.Now()
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			resp, err := cli.Status(ctx, c.nodes[i].cfg.LCUrls[0].Host)
			cancel()
			if err != nil {
				c.nodes[i].statusLock.Lock()
				c.nodes[i].status.State = StoppedNodeStatus
				c.nodes[i].status.StateTxt = fmt.Sprintf("%s was not reachable while getting status (%s)", c.nodes[i].status.Name, humanize.Time(now))
				c.nodes[i].status.IsLeader = false
				c.nodes[i].status.DBSize = 0
				c.nodes[i].status.DBSizeTxt = ""
				c.nodes[i].status.Hash = 0
				c.nodes[i].statusLock.Unlock()

				errc <- err
				return
			}

			isLeader, state := false, FollowerNodeStatus
			if resp.Header.MemberId == resp.Leader {
				isLeader, state = true, LeaderNodeStatus
			}
			status := NodeStatus{
				Name:      c.nodes[i].cfg.Name,
				ID:        types.ID(resp.Header.MemberId).String(),
				Endpoint:  c.nodes[i].cfg.LCUrls[0].String(),
				IsLeader:  isLeader,
				State:     state,
				StateTxt:  fmt.Sprintf("%s has been healthy (since %s)", c.nodes[i].status.Name, humanize.Time(c.nodes[i].stoppedStartedAt)),
				DBSize:    uint64(resp.DbSize),
				DBSizeTxt: humanize.Bytes(uint64(resp.DbSize)),
			}

			now = time.Now()
			conn, err := grpc.Dial(c.nodes[i].cfg.LCUrls[0].Host, grpc.WithTransportCredentials(credentials.NewTLS(tlsConfig)), grpc.WithTimeout(3*time.Second))
			if err != nil {
				c.nodes[i].statusLock.Lock()
				c.nodes[i].status.State = StoppedNodeStatus
				c.nodes[i].status.StateTxt = fmt.Sprintf("%s was not reachable while grpc.Dial (%s)", c.nodes[i].status.Name, humanize.Time(now))
				c.nodes[i].status.IsLeader = false
				c.nodes[i].status.DBSize = 0
				c.nodes[i].status.DBSizeTxt = ""
				c.nodes[i].status.Hash = 0
				c.nodes[i].statusLock.Unlock()

				errc <- err
				return
			}
			defer conn.Close()

			now = time.Now()
			mc := pb.NewMaintenanceClient(conn)
			ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
			var hresp *pb.HashResponse
			hresp, err = mc.Hash(ctx, &pb.HashRequest{})
			cancel()
			if err != nil {
				c.nodes[i].statusLock.Lock()
				c.nodes[i].status.State = StoppedNodeStatus
				c.nodes[i].status.StateTxt = fmt.Sprintf("%s was not reachable while getting hash (%s)", c.nodes[i].status.Name, humanize.Time(now))
				c.nodes[i].status.IsLeader = false
				c.nodes[i].status.DBSize = 0
				c.nodes[i].status.DBSizeTxt = ""
				c.nodes[i].status.Hash = 0
				c.nodes[i].statusLock.Unlock()

				errc <- err
				return
			}
			status.Hash = int(hresp.Hash)

			c.nodes[i].statusLock.Lock()
			c.nodes[i].status = status
			c.nodes[i].statusLock.Unlock()

			errc <- nil
		}(i)
	}

	cn := 0
	for err := range errc {
		if err != nil {
			plog.Warning("updateNodeStatus error:", err)
		}

		cn++
		if cn == c.size {
			close(errc)
		}
	}
	return
}

// AllConfigs returns all configurations.
func (c *Cluster) AllConfigs() []embed.Config {
	cs := make([]embed.Config, c.size)
	for i := range c.nodes {
		cs[i] = *c.nodes[i].cfg
	}
	return cs
}

// AllEndpoints returns all endpoints of clients.
func (c *Cluster) AllEndpoints(scheme bool) []string {
	eps := make([]string, c.size)
	for i := 0; i < c.size; i++ {
		if scheme {
			eps[i] = c.nodes[i].cfg.LCUrls[0].String()
		} else {
			eps[i] = c.nodes[i].cfg.LCUrls[0].Host
		}
	}
	return eps
}

// Client creates the client.
func (c *Cluster) Client(i int, scheme, allEndpoints bool, dialTimeout time.Duration) (*clientv3.Client, *tls.Config, error) {
	ep := c.nodes[i].cfg.LCUrls[0].Host
	if scheme {
		ep = c.nodes[i].cfg.LCUrls[0].String()
	}
	eps := []string{ep}
	if allEndpoints {
		eps = c.AllEndpoints(scheme)
	}
	ccfg := clientv3.Config{
		Endpoints:   eps,
		DialTimeout: dialTimeout,
	}

	if !c.nodes[i].cfg.ClientTLSInfo.Empty() {
		tlsConfig, err := c.nodes[i].cfg.ClientTLSInfo.ClientConfig()
		if err != nil {
			return nil, nil, err
		}
		ccfg.TLS = tlsConfig
	}

	cli, err := clientv3.New(ccfg)
	return cli, ccfg.TLS, err
}

// AllNodeStatus returns all node status.
func (c *Cluster) AllNodeStatus() []NodeStatus {
	st := make([]NodeStatus, c.size)
	for i := range c.nodes {
		st[i] = c.nodes[i].status
	}
	return st
}
