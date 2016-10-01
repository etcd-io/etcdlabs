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
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/coreos/etcd/embed"
	"github.com/coreos/etcd/pkg/transport"
)

// nodeState defines current Node state.
type nodeState uint8

const (
	stateNone nodeState = iota
	stateStarted
	stateStopped
)

// node contains *embed.Etcd and its state.
type node struct {
	srv        *embed.Etcd
	cfg        *embed.Config
	state      nodeState
	lastUpdate time.Time
}

// Cluster contains all embedded etcd nodes in the same cluster.
// Configuration is meant to be auto-generated.
type Cluster struct {
	mu             sync.Mutex
	rootDir        string
	size           int
	nodes          []*node
	updateInterval time.Duration
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

	// UpdateInterval is the minimum duration to allow updates on nodes.
	// This is to rate limit the nodes stop and restart operations.
	UpdateInterval time.Duration
}

var minUpdateInterval = time.Second

// Start starts embedded etcd cluster.
func Start(ccfg Config) (c *Cluster, err error) {
	plog.Printf("starting %d nodes (root directory %q, root port :%d)", ccfg.Size, ccfg.RootDir, ccfg.RootPort)

	if ccfg.UpdateInterval < minUpdateInterval {
		ccfg.UpdateInterval = minUpdateInterval
	}

	c = &Cluster{
		rootDir:        ccfg.RootDir,
		size:           ccfg.Size,
		nodes:          make([]*node, ccfg.Size),
		updateInterval: ccfg.UpdateInterval,
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

		cfg.Name = fmt.Sprintf("name%d", i)
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

		c.nodes[i] = &node{cfg: cfg}

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
	for i := range c.nodes {
		go func(i int) {
			defer wg.Done()

			<-c.nodes[i].srv.Server.ReadyNotify()

			c.nodes[i].state = stateStarted
			c.nodes[i].lastUpdate = time.Now()

			plog.Printf("started %q (client %s, peer %s)", c.nodes[i].cfg.Name, c.nodes[i].cfg.LCUrls[0].String(), c.nodes[i].cfg.LPUrls[0].String())
		}(i)
	}
	wg.Wait()

	plog.Printf("started %d nodes (ready!)", ccfg.Size)
	return c, nil
}

// Stop stops a node.
func (c *Cluster) Stop(i int) {
	plog.Printf("stopping %q", c.nodes[i].cfg.Name)

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.nodes[i].state == stateStopped {
		plog.Warningf("%q is already stopped", c.nodes[i].cfg.Name)
		return
	}

	for {
		it := time.Since(c.nodes[i].lastUpdate)
		if it > c.updateInterval {
			break
		}

		more := c.updateInterval - it + 100*time.Millisecond
		plog.Printf("rate-limiting stopping %q (sleeping %v)", c.nodes[i].cfg.Name, more)

		time.Sleep(more)
	}

	c.nodes[i].state = stateStopped
	c.nodes[i].lastUpdate = time.Now()

	c.nodes[i].srv.Close()
	<-c.nodes[i].srv.Err()

	plog.Printf("stopped %q", c.nodes[i].cfg.Name)
}

// Restart restarts a node.
func (c *Cluster) Restart(i int) error {
	plog.Printf("restarting %q", c.nodes[i].cfg.Name)

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.nodes[i].state == stateStarted {
		plog.Warningf("%q is already started", c.nodes[i].cfg.Name)
		return nil
	}

	for {
		it := time.Since(c.nodes[i].lastUpdate)
		if it > c.updateInterval {
			break
		}

		more := c.updateInterval - it + 100*time.Millisecond
		plog.Printf("rate-limiting restarting %q (sleeping %v)", c.nodes[i].cfg.Name, more)

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

	c.nodes[i].state = stateStarted
	c.nodes[i].lastUpdate = time.Now()

	plog.Printf("restarted %q", c.nodes[i].cfg.Name)
	return nil
}

// Shutdown stops all nodes and deletes all data directories.
func (c *Cluster) Shutdown() {
	plog.Println("shutting down all nodes")

	c.mu.Lock()
	defer c.mu.Unlock()

	var wg sync.WaitGroup
	wg.Add(c.size)
	for i := range c.nodes {
		go func(i int) {
			defer wg.Done()

			if c.nodes[i].state == stateStopped {
				plog.Warningf("%q is already stopped", c.nodes[i].cfg.Name)
				return
			}

			c.nodes[i].state = stateStopped
			c.nodes[i].lastUpdate = time.Now()

			c.nodes[i].srv.Close()
			<-c.nodes[i].srv.Err()
		}(i)
	}
	wg.Wait()

	os.RemoveAll(c.rootDir)
	plog.Printf("deleted %q (done!)", c.rootDir)
}

// AllEndpoints returns all endpoints of clients.
func (c *Cluster) AllEndpoints(scheme bool) []string {
	c.mu.Lock()
	defer c.mu.Unlock()

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
