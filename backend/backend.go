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

package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster"
	humanize "github.com/dustin/go-humanize"
)

// ContextHandler handles ServeHTTP with context.
type ContextHandler interface {
	ServeHTTPContext(context.Context, http.ResponseWriter, *http.Request) error
}

// ContextHandlerFunc defines HandlerFunc function signature to wrap context.
type ContextHandlerFunc func(context.Context, http.ResponseWriter, *http.Request) error

// ServeHTTPContext serve HTTP requests with context.
func (f ContextHandlerFunc) ServeHTTPContext(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	return f(ctx, w, req)
}

// ContextAdapter wraps context handler.
type ContextAdapter struct {
	ctx     context.Context
	handler ContextHandler
}

func (ca *ContextAdapter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if err := ca.handler.ServeHTTPContext(ca.ctx, w, req); err != nil {
		plog.Errorf("ServeHTTP (%v) [method: %q | path: %q]", err, req.Method, req.URL.Path)
	}
}

var (
	rootPortMu sync.Mutex
	rootPort   = 2379
)

func startCluster() (*cluster.Cluster, error) {
	rootPortMu.Lock()
	port := rootPort
	rootPort += 10 // for testing
	rootPortMu.Unlock()

	dir, err := ioutil.TempDir(os.TempDir(), "backend-cluster")
	if err != nil {
		return nil, err
	}

	cfg := cluster.Config{
		Size:          5,
		RootDir:       dir,
		RootPort:      port,
		ClientAutoTLS: true,
	}
	return cluster.Start(cfg)
}

var globalCluster *cluster.Cluster

func init() {
	c, err := startCluster()
	if err != nil {
		plog.Panic(err)
	}
	globalCluster = c
}

// Server warps http.Server.
type Server struct {
	mu         sync.RWMutex
	addr       string
	httpServer *http.Server

	rootCancel func()
	stopc      chan struct{}
	donec      chan struct{}
}

// StartServer starts a backend webserver with stoppable listener.
func StartServer(port int) (*Server, error) {
	stopc := make(chan struct{})
	ln, err := NewListenerStoppable("http", fmt.Sprintf("localhost:%d", port), nil, stopc)
	if err != nil {
		return nil, err
	}

	rootContext, rootCancel := context.WithTimeout(context.Background(), 10*time.Second)

	mainRouter := http.NewServeMux()
	mainRouter.Handle("/server-status", &ContextAdapter{
		ctx:     rootContext,
		handler: ContextHandlerFunc(serverStatusHandler),
	})

	addr := fmt.Sprintf("http://localhost:%d", port)
	plog.Infof("started server %s", addr)
	srv := &Server{
		addr:       addr,
		httpServer: &http.Server{Addr: addr, Handler: mainRouter},

		rootCancel: rootCancel,
		stopc:      stopc,
		donec:      make(chan struct{}),
	}

	go func() {
		defer func() {
			if err := recover(); err != nil {
				plog.Errorf("etcd-play error (%v)", err)
				os.Exit(0)
			}
			srv.rootCancel()
			close(srv.donec)
		}()

		if err := srv.httpServer.Serve(ln); err != nil && err != ErrListenerStopped {
			plog.Panic(err)
		}
	}()
	return srv, nil
}

// Stop stops the server. Useful for testing.
func (srv *Server) Stop() {
	plog.Warningf("stopping server %s", srv.addr)
	srv.mu.Lock()
	if srv.httpServer == nil {
		srv.mu.Unlock()
		return
	}
	close(srv.stopc)
	<-srv.donec
	srv.httpServer = nil
	srv.mu.Unlock()
	plog.Warningf("stopped server %s", srv.addr)

	plog.Warning("stopping cluster")
	globalCluster.Shutdown()
	globalCluster = nil
	plog.Warning("stopped cluster")
}

var (
	uptimeScale = time.Second
	startTime   = time.Now().Round(uptimeScale)
)

// ServerStatus defines server status.
type ServerStatus struct {
	// ServerUptime is the duration since last deploy.
	ServerUptime string `json:"server-uptime"`
	// NodeStatuses contains all node statuses.
	NodeStatuses []cluster.NodeStatus `json:"node-statuses"`
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		ss := ServerStatus{
			ServerUptime: humanize.Time(startTime),
			NodeStatuses: globalCluster.AllNodeStatus(),
		}
		if err := json.NewEncoder(w).Encode(ss); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
