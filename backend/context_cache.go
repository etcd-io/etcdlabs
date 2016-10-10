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
	"errors"
	"net/http"
	"net/url"
	"sync"

	"github.com/gorilla/websocket"
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

type key int

const userKey key = 0

type userData struct {
	upgrader *websocket.Upgrader
}

var (
	globalCacheLock sync.Mutex
	globalCache     = make(map[string]*userData)
)

func checkSameOrigin(req *http.Request) bool {
	origin := req.Header["Origin"]
	if len(origin) == 0 {
		return true
	}
	u, err := url.Parse(origin[0])
	if err != nil {
		return false
	}

	if u.Host == "localhost:4200" { // sync with Angular app
		return true
	}

	plog.Warningf("can verify the origin %q (expected %q)", req.Host, u.Host)
	return false
}

var (
	errUserLeft = errors.New("websocket: close 1001 (going away)")
)

func withCache(h ContextHandler) ContextHandler {
	return ContextHandlerFunc(func(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
		userID := getUserID(req)
		ctx = context.WithValue(ctx, userKey, &userID)

		globalCacheLock.Lock()
		if _, ok := globalCache[userID]; !ok { // if user visits first time, create user cache
			plog.Infof("just created user %q", userID)

			globalCache[userID] = &userData{
				upgrader: &websocket.Upgrader{CheckOrigin: checkSameOrigin},
			}
		}
		globalCacheLock.Unlock()

		err := h.ServeHTTPContext(ctx, w, req)
		if err != nil && err.Error() == errUserLeft.Error() {
			plog.Infof("user %q just left the browser", userID)

			globalCacheLock.Lock()
			delete(globalCache, userID)
			globalCacheLock.Unlock()
			err = nil
		}
		return err
	})
}
