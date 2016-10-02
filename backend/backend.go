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
	"fmt"
	"net/http"
	"os"
	"time"
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

// StartServer starts a backend webserver with stoppable listener.
func StartServer(port int) (chan<- struct{}, error) {
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

	go func() {
		defer func() {
			if err := recover(); err != nil {
				plog.Errorf("etcd-play error (%v)", err)
				os.Exit(0)
			}
		}()
		srv := &http.Server{Addr: addr, Handler: mainRouter}
		if err := srv.Serve(ln); err != nil && err != ErrListenerStopped {
			plog.Panic(err)
		}
	}()

	return stopc, nil
}

type key int

const userKey key = 0

func startHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	// user := ctx.Value(userKey).(*string)
	// userID := *user

	switch req.Method {
	case "GET":

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	return nil
}
