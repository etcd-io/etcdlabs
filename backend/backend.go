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
	"strings"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster"
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

// Server warps http.Server.
type Server struct {
	mu         sync.RWMutex
	addr       string
	httpServer *http.Server
	stopc      chan struct{}
	donec      chan struct{}
}

// StartServer starts a backend webserver with stoppable listener.
func StartServer(port int) (*Server, error) {
	rootContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mainRouter := http.NewServeMux()
	mainRouter.Handle("/start", &ContextAdapter{
		ctx:     rootContext,
		handler: ContextHandlerFunc(startHandler),
	})
	mainRouter.Handle("/server-status", &ContextAdapter{
		ctx:     rootContext,
		handler: ContextHandlerFunc(serverStatusHandler),
	})

	stopc := make(chan struct{})
	ln, err := NewListenerStoppable("http", fmt.Sprintf("localhost:%d", port), nil, stopc)
	if err != nil {
		return nil, err
	}

	addr := fmt.Sprintf("http://localhost:%d", port)
	plog.Infof("started serving %q", addr)
	srv := &Server{
		addr:       addr,
		httpServer: &http.Server{Addr: addr, Handler: mainRouter},
		stopc:      stopc,
		donec:      make(chan struct{}),
	}

	go func() {
		defer func() {
			if err := recover(); err != nil {
				plog.Errorf("etcd-play error (%v)", err)
				os.Exit(0)
			}

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
	srv.mu.Lock()

	if srv.httpServer == nil {
		srv.mu.Unlock()
		return
	}

	plog.Warningf("stopping %s", srv.addr)
	close(srv.stopc)
	<-srv.donec
	srv.httpServer = nil
	plog.Warningf("stopped %s", srv.addr)

	srv.mu.Unlock()

	globalCache.mu.Lock()
	plog.Warning("stopping cluster")
	if globalCache.cluster != nil {
		globalCache.cluster.Shutdown()
	}
	globalCache.cluster = nil
	plog.Warning("stopped cluster %s")
	globalCache.mu.Unlock()
}

var (
	muRootPort sync.Mutex
	rootPort   = 2379
)

func startHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		globalCache.mu.Lock()
		defer globalCache.mu.Unlock()

		if globalCache.cluster != nil {
			return nil
		}

		muRootPort.Lock()
		port := rootPort
		rootPort += 20
		muRootPort.Unlock()

		dir, err := ioutil.TempDir(os.TempDir(), "backend-cluster")
		if err != nil {
			return err
		}
		cfg := cluster.Config{
			Size:          5,
			RootDir:       dir,
			RootPort:      port,
			ClientAutoTLS: true,
		}
		cl, err := cluster.Start(cfg)
		if err != nil {
			return err
		}
		globalCache.cluster = cl

		resp := struct {
			Message string
		}{
			fmt.Sprintf("etcd cluster: %s", strings.Join(cl.AllEndpoints(true), ", ")),
		}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		globalCache.mu.RLock()
		defer globalCache.mu.RUnlock()

		st := globalCache.cluster.AllNodeStatus()
		fmt.Println(st)

		// TODO: serve NodeStatus from globalCache.cluster

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
