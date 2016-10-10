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
	"net/http"

	"github.com/coreos/etcdlabs/cluster"
	humanize "github.com/dustin/go-humanize"
)

// Connect contains initial server state.
type Connect struct {
	WebPort int
}

func connectHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		resp := Connect{WebPort: globalWebserverPort}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}

func wsHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	user := ctx.Value(userKey).(*string)
	userID := *user

	globalCacheLock.Lock()
	upgrader := globalCache[userID].upgrader
	globalCacheLock.Unlock()

	c, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		plog.Infof("user %q just left the browser", userID)

		// clean up users that just left the browser
		globalCacheLock.Lock()
		delete(globalCache, userID)
		globalCacheLock.Unlock()
		return err
	}

	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			globalCacheLock.Lock()
			delete(globalCache, userID)
			globalCacheLock.Unlock()
			return err
		}
		if err := c.WriteMessage(mt, message); err != nil {
			globalCacheLock.Lock()
			delete(globalCache, userID)
			globalCacheLock.Unlock()
			return err
		}
	}
}

// ServerStatus defines server status.
// Encode without json tags to make it parsable by Typescript.
type ServerStatus struct {
	// PlaygroundActive is true when the user is still active in '/play'.
	PlaygroundActive bool
	// ServerUptime is the duration since last deploy.
	ServerUptime string
	// NodeStatuses contains all node statuses.
	NodeStatuses []cluster.NodeStatus
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		user := ctx.Value(userKey).(*string)
		userID := *user
		globalCacheLock.Lock()
		_, active := globalCache[userID]
		globalCacheLock.Unlock()

		ss := ServerStatus{
			PlaygroundActive: active,
			ServerUptime:     humanize.Time(globalCluster.Started),
			NodeStatuses:     globalCluster.AllNodeStatus(),
		}
		if err := json.NewEncoder(w).Encode(ss); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
