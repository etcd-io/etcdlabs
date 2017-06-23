package cluster

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster/clusterpb"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/compactor"
	"github.com/coreos/etcd/embed"
	"github.com/coreos/etcd/pkg/netutil"
	"github.com/coreos/etcd/pkg/transport"
	"github.com/golang/glog"
	"golang.org/x/sync/errgroup"
)

// Cluster contains all embedded etcd Members in the same cluster.
// Configuration is meant to be auto-generated.
type Cluster struct {
	embeddedClient bool
	Started        time.Time

	// opLock blocks Stop, Restart, Shutdown.
	opLock sync.Mutex

	mmu               sync.RWMutex // member change
	size              int
	LeadIdx           int
	Members           []*Member
	clientHostToIndex map[string]int

	clientDialTimeout time.Duration // for client requests

	stopc chan struct{} // to signal UpdateMemberStatus

	rootCtx    context.Context
	rootCancel func()

	basePort int
	rootDir  string
	ccfg     Config
}

// Config defines etcd local cluster Configuration.
type Config struct {
	Size     int
	RootDir  string
	RootPort int

	EmbeddedClient bool
	PeerTLSInfo    transport.TLSInfo
	PeerAutoTLS    bool
	ClientTLSInfo  transport.TLSInfo
	ClientAutoTLS  bool

	RootCtx     context.Context
	RootCancel  func()
	DialTimeout time.Duration // for client requests
}

// PeerScheme returns the peer scheme.
// TODO: support unix
func (c Config) PeerScheme() string {
	scheme := "https"
	if c.PeerTLSInfo.Empty() && !c.PeerAutoTLS {
		scheme = "http"
	}
	return scheme
}

// ClientScheme returns the client scheme.
// TODO: support unix
func (c Config) ClientScheme() string {
	scheme := "https"
	if c.ClientTLSInfo.Empty() && !c.ClientAutoTLS {
		scheme = "http"
	}
	return scheme
}

var defaultDialTimeout = time.Second

// Start starts embedded etcd cluster.
func Start(ccfg Config) (clus *Cluster, err error) {
	if ccfg.Size > 7 {
		return nil, fmt.Errorf("max cluster size is 7, got %d", ccfg.Size)
	}

	glog.Infof("starting %d Members (root directory %q, root port :%d)", ccfg.Size, ccfg.RootDir, ccfg.RootPort)

	dt := ccfg.DialTimeout
	if dt == time.Duration(0) {
		dt = defaultDialTimeout
	}

	clus = &Cluster{
		embeddedClient:    ccfg.EmbeddedClient,
		Started:           time.Now(),
		size:              ccfg.Size,
		Members:           make([]*Member, ccfg.Size),
		clientHostToIndex: make(map[string]int, ccfg.Size),
		clientDialTimeout: dt,
		stopc:             make(chan struct{}),
		rootCtx:           ccfg.RootCtx,
		rootCancel:        ccfg.RootCancel,

		basePort: ccfg.RootPort,
		rootDir:  ccfg.RootDir,
		ccfg:     ccfg,
	}

	if !existFileOrDir(ccfg.RootDir) {
		glog.Infof("creating root directory %q", ccfg.RootDir)
		if err = mkdirAll(ccfg.RootDir); err != nil {
			return nil, err
		}
	} else {
		glog.Infof("removing root directory %q", ccfg.RootDir)
		os.RemoveAll(ccfg.RootDir)
	}

	glog.Infof("getting default host")
	dhost, err := netutil.GetDefaultHost()
	if err != nil {
		glog.Warning(err)
		glog.Warning("overwriting default host with 'localhost")
		dhost = "localhost"
	}
	glog.Infof("detected default host %q", dhost)

	if !ccfg.PeerTLSInfo.Empty() && ccfg.PeerAutoTLS {
		return nil, fmt.Errorf("choose either auto peer TLS or manual peer TLS")
	}
	if !ccfg.ClientTLSInfo.Empty() && ccfg.ClientAutoTLS {
		return nil, fmt.Errorf("choose either auto client TLS or manual client TLS")
	}

	startPort := ccfg.RootPort
	for i := 0; i < ccfg.Size; i++ {
		cfg := embed.NewConfig()

		cfg.ClusterState = embed.ClusterStateFlagNew

		cfg.Name = fmt.Sprintf("node%d", i+1)
		cfg.Dir = filepath.Join(ccfg.RootDir, cfg.Name+".data-dir-etcd")
		cfg.WalDir = filepath.Join(ccfg.RootDir, cfg.Name+".data-dir-etcd", "wal")

		// this is fresh cluster, so remove any conflicting data
		os.RemoveAll(cfg.Dir)
		glog.Infof("removed %q", cfg.Dir)
		os.RemoveAll(cfg.WalDir)
		glog.Infof("removed %q", cfg.WalDir)

		curl := url.URL{Scheme: ccfg.ClientScheme(), Host: fmt.Sprintf("localhost:%d", startPort)}
		cfg.ACUrls = []url.URL{curl}
		cfg.LCUrls = []url.URL{curl}
		if dhost != "localhost" {
			// expose default host to other machines in listen address (e.g. Prometheus dashboard)
			curl2 := url.URL{Scheme: ccfg.ClientScheme(), Host: fmt.Sprintf("%s:%d", dhost, startPort)}
			cfg.LCUrls = append(cfg.LCUrls, curl2)
			glog.Infof("%q is set up to listen on client url %q (default host)", cfg.Name, curl2.String())
		}
		glog.Infof("%q is set up to listen on client url %q", cfg.Name, curl.String())

		purl := url.URL{Scheme: ccfg.PeerScheme(), Host: fmt.Sprintf("localhost:%d", startPort+1)}
		cfg.APUrls = []url.URL{purl}
		cfg.LPUrls = []url.URL{purl}
		glog.Infof("%q is set up to listen on peer url %q", cfg.Name, purl.String())

		cfg.ClientAutoTLS = ccfg.ClientAutoTLS
		cfg.ClientTLSInfo = ccfg.ClientTLSInfo
		cfg.PeerAutoTLS = ccfg.PeerAutoTLS
		cfg.PeerTLSInfo = ccfg.PeerTLSInfo

		// auto-compaction every hour
		cfg.AutoCompactionMode = compactor.ModePeriodic
		cfg.AutoCompactionRetention = 1

		clus.Members[i] = &Member{
			clus: clus,
			cfg:  cfg,
			status: clusterpb.MemberStatus{
				Name:     cfg.Name,
				Endpoint: curl.String(),
				IsLeader: false,
				State:    clusterpb.StoppedMemberStatus,
			},
		}

		clus.clientHostToIndex[curl.Host] = i

		startPort += 2
	}
	clus.basePort = startPort

	for i := 0; i < clus.size; i++ {
		clus.Members[i].cfg.InitialCluster = clus.initialCluster()
	}

	var g errgroup.Group
	for i := 0; i < clus.size; i++ {
		idx := i
		g.Go(func() error { return clus.Members[idx].Start() })
	}
	if gerr := g.Wait(); gerr != nil {
		return nil, gerr
	}

	time.Sleep(time.Second)

	return clus, clus.WaitForLeader()
}

// StopNotify returns receive-only stop channel to notify the cluster has stopped.
func (clus *Cluster) StopNotify() <-chan struct{} {
	return clus.stopc
}

// Stop stops a node.
func (clus *Cluster) Stop(i int) {
	clus.opLock.Lock()
	defer clus.opLock.Unlock()
	clus.Members[i].Stop()
}

// Restart restarts a node.
func (clus *Cluster) Restart(i int) error {
	clus.opLock.Lock()
	defer clus.opLock.Unlock()
	return clus.Members[i].Restart()
}

// Add adds one member.
func (clus *Cluster) Add() error {
	glog.Infof("getting default host")
	dhost, err := netutil.GetDefaultHost()
	if err != nil {
		glog.Warning(err)
		glog.Warning("overwriting default host with 'localhost")
		dhost = "localhost"
	}
	glog.Infof("detected default host %q", dhost)

	clus.opLock.Lock()
	defer clus.opLock.Unlock()

	clus.mmu.Lock()
	defer clus.mmu.Unlock()

	cfg := embed.NewConfig()

	cfg.ClusterState = embed.ClusterStateFlagExisting

	cfg.Name = fmt.Sprintf("node%d", clus.size+1)
	cfg.Dir = filepath.Join(clus.rootDir, cfg.Name+".data-dir-etcd")
	cfg.WalDir = filepath.Join(clus.rootDir, cfg.Name+".data-dir-etcd", "wal")

	// this is fresh cluster, so remove any conflicting data
	os.RemoveAll(cfg.Dir)
	glog.Infof("removed %q", cfg.Dir)
	os.RemoveAll(cfg.WalDir)
	glog.Infof("removed %q", cfg.WalDir)

	curl := url.URL{Scheme: clus.ccfg.ClientScheme(), Host: fmt.Sprintf("localhost:%d", clus.basePort)}
	cfg.ACUrls = []url.URL{curl}
	cfg.LCUrls = []url.URL{curl}
	if dhost != "localhost" {
		// expose default host to other machines in listen address (e.g. Prometheus dashboard)
		curl2 := url.URL{Scheme: clus.ccfg.ClientScheme(), Host: fmt.Sprintf("%s:%d", dhost, clus.basePort)}
		cfg.LCUrls = append(cfg.LCUrls, curl2)
		glog.Infof("%q is set up to listen on client url %q (default host)", cfg.Name, curl2.String())
	}
	glog.Infof("%q is set up to listen on client url %q", cfg.Name, curl.String())

	purl := url.URL{Scheme: clus.ccfg.PeerScheme(), Host: fmt.Sprintf("localhost:%d", clus.basePort+1)}
	cfg.APUrls = []url.URL{purl}
	cfg.LPUrls = []url.URL{purl}

	clus.size++
	clus.basePort += 2

	cfg.ClientAutoTLS = clus.ccfg.ClientAutoTLS
	cfg.ClientTLSInfo = clus.ccfg.ClientTLSInfo
	cfg.PeerAutoTLS = clus.ccfg.PeerAutoTLS
	cfg.PeerTLSInfo = clus.ccfg.PeerTLSInfo

	// auto-compaction every hour
	cfg.AutoCompactionMode = compactor.ModePeriodic
	cfg.AutoCompactionRetention = 1

	clus.Members = append(clus.Members, &Member{
		clus: clus,
		cfg:  cfg,
		status: clusterpb.MemberStatus{
			Name:     cfg.Name,
			Endpoint: curl.String(),
			IsLeader: false,
			State:    clusterpb.StoppedMemberStatus,
		},
	})
	idx := len(clus.Members) - 1
	clus.clientHostToIndex[curl.Host] = idx

	for i := 0; i < clus.size; i++ {
		clus.Members[i].cfg.InitialCluster = clus.initialCluster()
	}

	glog.Infof("adding member %q", clus.Members[idx].cfg.Name)
	cli, _, err := clus.Members[0].Client(false)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(clus.rootCtx, 3*time.Second)
	_, err = cli.MemberAdd(ctx, []string{clus.Members[idx].cfg.APUrls[0].String()})
	cancel()
	if err != nil {
		return err
	}
	glog.Infof("added member %q", clus.Members[idx].cfg.Name)

	glog.Infof("starting member %q", clus.Members[idx].cfg.Name)
	if serr := clus.Members[idx].Start(); serr != nil {
		return serr
	}
	glog.Infof("started member %q", clus.Members[idx].cfg.Name)

	return nil
}

// Remove removes the member and its data.
func (clus *Cluster) Remove(i int) error {
	clus.opLock.Lock()
	defer clus.opLock.Unlock()

	clus.mmu.Lock()
	defer clus.mmu.Unlock()

	idx := (i + 1) % clus.size
	glog.Infof("removing member %q", clus.Members[i].cfg.Name)
	cli, _, err := clus.Members[idx].Client(false)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(clus.rootCtx, 3*time.Second)
	_, err = cli.MemberRemove(ctx, uint64(clus.Members[i].srv.Server.ID()))
	cancel()
	if err != nil {
		return err
	}
	glog.Infof("removed member %q", clus.Members[idx].cfg.Name)

	clus.size--
	var newms []*Member
	for j := range clus.Members {
		if j == i {
			continue
		}
		newms = append(newms, clus.Members[j])
	}
	clus.Members = newms
	for j, m := range clus.Members {
		clus.clientHostToIndex[m.cfg.LCUrls[0].Host] = j
	}

	clus.Members[i].Stop()

	os.RemoveAll(clus.Members[i].cfg.Dir)
	glog.Infof("removed %q", clus.Members[i].cfg.Dir)

	os.RemoveAll(clus.Members[i].cfg.WalDir)
	glog.Infof("removed %q", clus.Members[i].cfg.WalDir)

	return nil
}

// Shutdown stops all Members and deletes all data directories.
func (clus *Cluster) Shutdown() {
	clus.rootCancel()
	close(clus.stopc) // stopping UpdateMemberStatus

	clus.opLock.Lock()
	defer clus.opLock.Unlock()

	glog.Info("shutting down all Members")
	var wg sync.WaitGroup
	wg.Add(clus.size)
	for i := 0; i < clus.size; i++ {
		go func(i int) {
			defer wg.Done()
			clus.Members[i].Stop()
		}(i)
	}
	wg.Wait()

	os.RemoveAll(clus.rootDir)
	glog.Infof("successfully shutdown cluster (deleted %q)", clus.rootDir)
}

// WaitForLeader waits for cluster to elect a new leader.
func (clus *Cluster) WaitForLeader() error {
	glog.Info("wait for leader election")
	var g errgroup.Group
	for i := 0; i < clus.size; i++ {
		idx := i
		g.Go(func() error {
			return clus.Members[idx].WaitForLeader()
		})
	}
	if gerr := g.Wait(); gerr != nil {
		return gerr
	}
	glog.Info("waited for leader election")

	clus.mmu.Lock()
	defer clus.mmu.Unlock()

	found := false
	for i, m := range clus.Members {
		if m.status.IsLeader {
			if found {
				return fmt.Errorf("duplicate leader? %q(%s) claims to be the leader", clus.Members[clus.LeadIdx].cfg.Name, clus.Members[clus.LeadIdx].srv.Server.ID())
			}
			clus.LeadIdx = i
			glog.Infof("%q(%s) is the leader", m.cfg.Name, m.srv.Server.ID())
			found = true
		}
	}
	return nil
}

// Client creates the client.
func (clus *Cluster) Client(eps ...string) (*clientv3.Client, *tls.Config, error) {
	if len(eps) == 0 {
		return nil, nil, errors.New("no endpoint is given")
	}
	idx, ok := clus.clientHostToIndex[getHost(eps[0])]
	if !ok {
		return nil, nil, fmt.Errorf("cannot find node with endpoint %s", eps[0])
	}
	return clus.Members[idx].Client(false, eps...)
}

// UpdateMemberStatus updates node statuses.
func (clus *Cluster) UpdateMemberStatus() {
	clus.mmu.Lock()
	defer clus.mmu.Unlock()

	var wg sync.WaitGroup
	wg.Add(clus.size)
	for i := 0; i < clus.size; i++ {
		go func(i int) {
			defer func() {
				if err := recover(); err != nil {
					glog.Warning("recovered from panic", err)
					select {
					case <-clus.rootCtx.Done():
						glog.Warning("rootCtx is done with", clus.rootCtx.Err())
					default:
					}
				}
				wg.Done()
			}()
			if err := clus.Members[i].FetchMemberStatus(); err != nil {
				glog.Warning(err)
			}
		}(i)
	}

	wf := func() <-chan struct{} {
		wg.Wait()
		ch := make(chan struct{})
		close(ch)
		return ch
	}

	select {
	case <-clus.stopc:
	case <-wf():
	}
	return
}
