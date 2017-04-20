package lru

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/coreos/pkg/capnslog"
	"google.golang.org/grpc/grpclog"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/embed"
	"github.com/coreos/etcd/etcdserver/api/v3client"
)

var plog = capnslog.NewPackageLogger("github.com/coreos/etcdlabs", "lru")

func init() {
	capnslog.SetGlobalLogLevel(capnslog.INFO)
	grpclog.SetLogger(plog)
}

// EtcdCache defines LRU cache store, backed by etcd.
type EtcdCache interface {
	Cache
	Start() error
	Stop() error
	Shutdown() error
}

// New returns LRU cache, backed by local embedded etcd.
// TODO: support remote etcd cluster? Should be simple.
func New(size int, clientPort, peerPort int, dataDir string) EtcdCache {
	return &etcdCache{cap: size, cport: clientPort, pport: peerPort, dataDir: dataDir}
}

type etcdCache struct {
	cap int

	cport   int
	pport   int
	dataDir string

	e *embed.Etcd
}

// TODO: cache eviction by key-value version, with compact?
// TODO: encode key in binary, protocol buffer?
// TODO: marshal/unmarshal member status?
// TODO: mutex to protect concurrent start,stop,shutdown operation
// TOOD: keep track of cache server status (stopped,started,...)
// TODO: pass root context to all client calls

// Start starts a new etcd server.
func (e *etcdCache) Start() error {
	if e.dataDir == "" {
		e.dataDir = filepath.Join(os.TempDir(), "etcd-cache")
	}

	cfg := embed.NewConfig()
	cfg.Dir = e.dataDir
	plog.Printf("%q is set up with data-dir %q", cfg.Name, cfg.Dir)

	curl := url.URL{Scheme: "http", Host: fmt.Sprintf("localhost:%d", e.cport)}
	cfg.ACUrls = []url.URL{curl}
	cfg.LCUrls = []url.URL{curl}
	plog.Infof("%q is set up to listen on client url %q", cfg.Name, curl.String())

	purl := url.URL{Scheme: "http", Host: fmt.Sprintf("localhost:%d", e.pport)}
	cfg.APUrls = []url.URL{purl}
	cfg.LPUrls = []url.URL{purl}
	plog.Infof("%q is set up to listen on peer url %q", cfg.Name, purl.String())

	cfg.InitialCluster = cfg.Name + "=" + cfg.APUrls[0].String()

	cfg.AutoCompactionRetention = 1

	srv, err := embed.StartEtcd(cfg)
	if err != nil {
		return err
	}
	e.e = srv

	var rerr error
	select {
	case <-e.e.Server.ReadyNotify():
	case rerr = <-e.e.Err():
	case <-e.e.Server.StopNotify():
		rerr = fmt.Errorf("received from etcdserver.Server.StopNotify")
	}
	if rerr != nil {
		return rerr
	}

	plog.Printf("started single-node %s (client %s, peer %s)", cfg.Name, cfg.LCUrls[0].String(), cfg.LPUrls[0].String())
	return nil
}

// Stop stops the etcd cache server.
func (e *etcdCache) Stop() error {
	e.e.Close()

	var cerr error
	select {
	case cerr = <-e.e.Err():
	case <-e.e.Server.StopNotify():
		cerr = fmt.Errorf("received from EtcdServer.StopNotify")
	}
	if cerr != nil {
		plog.Warningf("shutdown with %q", cerr.Error())
	} else {
		plog.Printf("shutdown with no error")
	}
	plog.Printf("stopped %q(%s)", e.e.Server.Cfg.Name, e.e.Server.ID().String())
	return nil
}

// Shutdown stops and remove all data directories.
func (e *etcdCache) Shutdown() error {
	if err := e.Stop(); err != nil {
		return err
	}
	plog.Infof("removing %q", e.dataDir)
	return os.RemoveAll(e.dataDir)
}

// Put writes a key to etcd.
func (e *etcdCache) Put(key, value interface{}) error {
	cli := v3client.New(e.e.Server) // embedded client
	defer cli.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

	resp, err := cli.Put(ctx, fmt.Sprint(key), fmt.Sprint(value), clientv3.WithPrevKV())
	cancel()
	if err != nil {
		return err
	}

	if resp.PrevKv != nil && resp.PrevKv.Version >= int64(e.cap) {
		fmt.Println("prev:", resp.PrevKv)
	}
	return nil
}

// Get reads a key from etcd.
func (e *etcdCache) Get(key interface{}) (interface{}, error) {
	cli := v3client.New(e.e.Server) // embedded client
	defer cli.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)

	// it's cache, so serving stale data is ok, for now
	resp, err := cli.Get(ctx, fmt.Sprint(key), clientv3.WithSerializable())
	cancel()
	if err != nil {
		return nil, err
	}

	fmt.Printf("%+v\n", resp)
	for _, kv := range resp.Kvs {
		fmt.Printf("get resp: %+v\n", kv)
	}

	if len(resp.Kvs) == 0 {
		return nil, ErrKeyNotFound
	}

	kv := resp.Kvs[0]
	if kv.Version >= int64(e.cap) {
		// evict
	}
	return kv.Value, err
}
