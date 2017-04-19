package lru

import (
	"fmt"

	"github.com/coreos/etcd/embed"
)

// New returns LRU cache, backed by local embedded etcd.
// TODO: support remote etcd cluster? Should be simple.
func New(size int, clientPort, peerPort int) Cache {
	return &etcdCache{cap: size, cport: clientPort, pport: peerPort}
}

type etcdCache struct {
	cap int

	cport int
	pport int

	dataDir string
	e       *embed.Etcd
}

func (e *etcdCache) Connect() error {
	cfg := embed.NewConfig()
	srv, err := embed.StartEtcd(cfg)
	if err != nil {
		return err
	}
	e.e = srv

	var rerr error
	select {
	case <-srv.Server.ReadyNotify():
	case rerr = <-srv.Err():
	case <-srv.Server.StopNotify():
		rerr = fmt.Errorf("received from etcdserver.Server.StopNotify")
	}
	if rerr != nil {
		return rerr
	}

	plog.Printf("started %s (client %s, peer %s)", cfg.Name, cfg.LCUrls[0].String(), cfg.LPUrls[0].String())
	return nil
}

func (e *etcdCache) Stop() error {
	e.e.Close()
	return nil
}

func (e *etcdCache) Put(key, value interface{}) error {
	// TODO
	return nil
}

func (e *etcdCache) Get(key interface{}) (interface{}, error) {
	// TODO
	return nil, nil
}
