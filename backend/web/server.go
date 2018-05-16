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

package web

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster"
	"github.com/coreos/etcdlabs/pkg/ratelimit"

	"github.com/axiomhq/hyperloglog"
)

var (
	rootPortMu sync.Mutex
	rootPort   = 2389
)

func startCluster(rootCtx context.Context, rootCancel func()) (*cluster.Cluster, error) {
	rootPortMu.Lock()
	port := rootPort
	rootPort += 10 // for testing
	rootPortMu.Unlock()

	dir, err := ioutil.TempDir(os.TempDir(), "backend-cluster")
	if err != nil {
		return nil, err
	}

	cfg := cluster.Config{
		EmbeddedClient: true,
		Size:           5,
		RootDir:        dir,
		RootPort:       port,
		ClientAutoTLS:  false,
		PeerAutoTLS:    false,
		RootCtx:        rootCtx,
		RootCancel:     rootCancel,
	}
	return cluster.Start(cfg)
}

// Server warps http.Server.
type Server struct {
	mu         sync.RWMutex
	addrURL    url.URL
	httpServer *http.Server

	rootCancel func()
	stopc      chan struct{}
	donec      chan struct{}
}

var (
	globalWebserverPort int

	globalCluster        *cluster.Cluster
	globalServerVisitsMu sync.Mutex
	globalServerVisits   = hyperloglog.New16()

	globalClientRequestIntervalLimit = 3 * time.Second
	globalClientRequestLimiter       ratelimit.RequestLimiter

	globalStopRestartIntervalLimit = 5 * time.Second
	globalStopRestartLimiter       ratelimit.RequestLimiter
)

// StartServer starts a backend webserver with stoppable listener.
func StartServer(port int) (*Server, error) {
	globalWebserverPort = port

	rootCtx, rootCancel := context.WithCancel(context.Background())
	c, err := startCluster(rootCtx, rootCancel)
	if err != nil {
		return nil, err
	}
	globalCluster = c

	// allow only 1 request for every 2 second
	globalClientRequestLimiter = ratelimit.NewRequestLimiter(rootCtx, globalClientRequestIntervalLimit)

	// rate-limit more strictly for every 3 second
	globalStopRestartLimiter = ratelimit.NewRequestLimiter(rootCtx, globalStopRestartIntervalLimit)

	mux := http.NewServeMux()
	mux.Handle("/health", &ContextAdapter{
		ctx: rootCtx,
		handler: ContextHandlerFunc(func(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
			w.WriteHeader(200)
			w.Write([]byte("OK"))
			return nil
		}),
	})
	mux.Handle("/conn", &ContextAdapter{
		ctx:     rootCtx,
		handler: withCache(ContextHandlerFunc(connectHandler)),
	})
	mux.Handle("/server-status", &ContextAdapter{
		ctx:     rootCtx,
		handler: withCache(ContextHandlerFunc(serverStatusHandler)),
	})
	mux.Handle("/client-request", &ContextAdapter{
		ctx:     rootCtx,
		handler: withCache(ContextHandlerFunc(clientRequestHandler)),
	})

	stopc := make(chan struct{})
	addrURL := url.URL{Scheme: "http", Host: fmt.Sprintf("localhost:%d", port)}
	lg.Infof("started server %s", addrURL.String())
	srv := &Server{
		addrURL:    addrURL,
		httpServer: &http.Server{Addr: addrURL.Host, Handler: mux},
		rootCancel: rootCancel,
		stopc:      stopc,
		donec:      make(chan struct{}),
	}

	go func() {
		defer func() {
			if err := recover(); err != nil {
				lg.Warnf("etcd-play error (%v)", err)
				os.Exit(0)
			}
			srv.rootCancel()
			close(srv.donec)
		}()

		go func() { updateClusterStatus(srv.stopc) }()
		go func() { cleanCache(srv.stopc) }()
		if err := srv.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			lg.Fatal(err)
		}
	}()
	return srv, nil
}

// StopNotify returns receive-only stop channel to notify the server has stopped.
func (srv *Server) StopNotify() <-chan struct{} {
	return srv.stopc
}

// Stop stops the server. Useful for testing.
func (srv *Server) Stop() {
	lg.Warnf("stopping server %s", srv.addrURL.String())
	srv.mu.Lock()
	if srv.httpServer == nil {
		srv.mu.Unlock()
		return
	}
	close(srv.stopc)
	srv.httpServer.Close()
	<-srv.donec
	srv.mu.Unlock()
	lg.Warnf("stopped server %s", srv.addrURL.String())

	lg.Warn("stopping cluster")
	globalCluster.Shutdown()
	globalCluster = nil
	lg.Warn("stopped cluster")
}
