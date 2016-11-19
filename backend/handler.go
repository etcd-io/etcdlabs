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
	"html/template"
	"net/http"
	"sync"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcdlabs/cluster"
	humanize "github.com/dustin/go-humanize"
)

type key int

const userKey key = 0

type userData struct {
	lastActive time.Time
}

var (
	globalUserCacheLock sync.Mutex
	globalUserCache     = make(map[string]userData)
)

func cleanCache(donec <-chan struct{}) {
	for {
		select {
		case <-donec:
			return
		case <-time.After(time.Hour):
		}

		globalUserCacheLock.Lock()
		for k, v := range globalUserCache {
			if time.Since(v.lastActive) > 30*time.Minute {
				plog.Infof("removing inactive user %q", k)
				delete(globalUserCache, k)
			}
		}
		globalUserCacheLock.Unlock()
	}
}

func withCache(h ContextHandler) ContextHandler {
	return ContextHandlerFunc(func(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
		userID := generateUserID(req)
		ctx = context.WithValue(ctx, userKey, &userID)

		globalUserCacheLock.Lock()
		if _, ok := globalUserCache[userID]; !ok { // if user visits first time, create user cache
			plog.Infof("just created user %q", userID)
			globalUserCache[userID] = userData{lastActive: time.Now()}
		}
		globalUserCacheLock.Unlock()

		return h.ServeHTTPContext(ctx, w, req)
	})
}

// Connect contains initial server state.
type Connect struct {
	WebPort int
	User    string
	Deleted bool
}

func connectHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	user := ctx.Value(userKey).(*string)
	userID := *user

	switch req.Method {
	case "GET":
		resp := Connect{WebPort: globalWebserverPort, User: userID, Deleted: false}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	case "DELETE": // user leaves component
		plog.Infof("user %q just left (user deleted)", userID)
		globalUserCacheLock.Lock()
		delete(globalUserCache, userID)
		globalUserCacheLock.Unlock()

		resp := Connect{WebPort: globalWebserverPort, User: userID, Deleted: true}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}

// ServerStatus defines server status.
// Encode without json tags to make it parsable by Typescript.
type ServerStatus struct {
	// PlaygroundActive is true when the user is still active in '/play'.
	PlaygroundActive bool

	// ServerUptime is the duration since last deploy.
	ServerUptime string

	// UserN is the number of online users.
	UserN int

	// Users is a slice of users with real IPs being masked.
	// Maximum 20 users are returned.
	Users []string

	// NodeStatuses contains all node statuses.
	NodeStatuses []cluster.NodeStatus
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		user := ctx.Value(userKey).(*string)
		userID := *user
		globalUserCacheLock.Lock()
		_, active := globalUserCache[userID]
		if active {
			globalUserCache[userID] = userData{lastActive: time.Now()}
		}
		globalUserCacheLock.Unlock()

		active = active && globalCluster != nil

		resp := ServerStatus{
			PlaygroundActive: active,
			ServerUptime:     humanize.Time(globalCluster.Started),
			UserN:            len(globalUserCache),
			Users:            getUserIDs(globalUserCache),
			NodeStatuses:     globalCluster.AllNodeStatus(),
		}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}

// KeyValue defines key-value pair.
type KeyValue struct {
	Key   string
	Value string
}

// ClientRequest defines client requests.
type ClientRequest struct {
	Action      string // 'write', 'stress', 'delete', 'get', 'stop-node', 'restart-node'
	RangePrefix bool   // 'delete', 'get'
	Endpoints   []string
	KeyValue    KeyValue
}

// ClientResponse translates client's GET response in frontend-friendly format.
type ClientResponse struct {
	ClientRequest ClientRequest
	Success       bool
	Result        string
	ResultLines   []string
	KeyValues     []KeyValue
}

var (
	minScaleToDisplay = time.Millisecond
	// ErrNoEndpoint is returned when client request has no target endpoint.
	ErrNoEndpoint = "no endpoint is given"
)

// clientRequestHandler handles writes, reads, deletes, kill, restart operations.
func clientRequestHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "POST":
		cresp := ClientResponse{Success: true}
		if rmsg, ok := globalClientRequestLimiter.Check(); !ok {
			cresp.Success = false
			cresp.Result = "client request " + rmsg
			cresp.ResultLines = []string{cresp.Result}
			return json.NewEncoder(w).Encode(cresp)
		}
		globalClientRequestLimiter.Advance()

		creq := ClientRequest{}
		if err := json.NewDecoder(req.Body).Decode(&creq); err != nil {
			cresp.Success = false
			cresp.Result = err.Error()
			cresp.ResultLines = []string{cresp.Result}
			return json.NewEncoder(w).Encode(cresp)
		}
		defer req.Body.Close()

		if creq.KeyValue.Key != "" {
			creq.KeyValue.Key = template.HTMLEscapeString(creq.KeyValue.Key)
		}
		if creq.KeyValue.Value != "" {
			creq.KeyValue.Value = template.HTMLEscapeString(creq.KeyValue.Value)
		}

		cresp.ClientRequest = creq

		if len(creq.Endpoints) == 0 {
			cresp.Success = false
			cresp.Result = ErrNoEndpoint
			cresp.ResultLines = []string{cresp.Result}
			return json.NewEncoder(w).Encode(cresp)
		}

		idx := globalCluster.FindIndex(creq.Endpoints[0])
		if idx == -1 {
			cresp.Success = false
			cresp.Result = fmt.Sprintf("wrong endpoints are given (%v)", creq.Endpoints)
			cresp.ResultLines = []string{cresp.Result}
			return json.NewEncoder(w).Encode(cresp)
		}

		cctx, ccancel := context.WithTimeout(ctx, 3*time.Second)
		defer ccancel()

		reqStart := time.Now()

		switch creq.Action {
		case "write":
			if creq.KeyValue.Key == "" {
				cresp.Success = false
				cresp.Result = fmt.Sprint("'write' request got empty key")
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			cli, _, err := globalCluster.Client(creq.Endpoints...)
			if err != nil {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			defer cli.Close()

			cresp.KeyValues = []KeyValue{creq.KeyValue}
			if _, err := cli.Put(cctx, creq.KeyValue.Key, creq.KeyValue.Value); err != nil {
				cresp.Success = false
				cresp.Result = err.Error()
				cresp.ResultLines = []string{cresp.Result}
			} else {
				cresp.Success = true
				cresp.Result = fmt.Sprintf("'write' success (took %v)", roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				lines := make([]string, 1)
				for i := range lines {
					ks, vs := cresp.KeyValues[i].Key, cresp.KeyValues[i].Value
					if len(ks) > 7 {
						ks = ks[:7] + "..."
					}
					if len(vs) > 7 {
						vs = vs[:7] + "..."
					}
					lines[i] = fmt.Sprintf("'write' success (key: %s, value: %s)", ks, vs)
				}
				cresp.ResultLines = lines
			}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "stress":
			cli, _, err := globalCluster.Client(creq.Endpoints...)
			if err != nil {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			defer cli.Close()

			cresp.KeyValues = multiRandKeyValues("foo", "bar", 3, 3)
			for _, kv := range cresp.KeyValues {
				if _, err := cli.Put(cctx, kv.Key, kv.Value); err != nil {
					cresp.Success = false
					cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
					cresp.ResultLines = []string{cresp.Result}
					break
				}
			}

			if cresp.Success {
				cresp.Result = fmt.Sprintf("'stress' success (took %v)", roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				lines := make([]string, 3)
				for i := range lines {
					ks, vs := cresp.KeyValues[i].Key, cresp.KeyValues[i].Value
					if len(ks) > 7 {
						ks = ks[:7] + "..."
					}
					if len(vs) > 7 {
						vs = vs[:7] + "..."
					}
					lines[i] = fmt.Sprintf("'stress' success (key: %s, value: %s)", ks, vs)
				}
				cresp.ResultLines = lines
			}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "delete":
			if creq.KeyValue.Key == "" {
				cresp.Success = false
				cresp.Result = fmt.Sprint("'delete' request got empty key")
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			cli, _, err := globalCluster.Client(creq.Endpoints...)
			if err != nil {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			defer cli.Close()

			var opts []clientv3.OpOption
			if creq.RangePrefix {
				opts = append(opts, clientv3.WithPrefix(), clientv3.WithPrevKV())
			}
			dresp, err := cli.Delete(cctx, creq.KeyValue.Key, opts...)
			if err != nil {
				cresp.Success = false
				cresp.Result = err.Error()
			}
			kvs := make([]KeyValue, len(dresp.PrevKvs))
			for i := range dresp.PrevKvs {
				kvs[i] = KeyValue{Key: string(dresp.PrevKvs[i].Key), Value: string(dresp.PrevKvs[i].Value)}
			}
			cresp.KeyValues = kvs

			if cresp.Success {
				cresp.Result = fmt.Sprintf("'delete' success (took %v)", roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				lines := make([]string, len(cresp.KeyValues))
				for i := range lines {
					lines[i] = fmt.Sprintf("'delete' success (key: %s, value: %s)", cresp.KeyValues[i].Key, cresp.KeyValues[i].Value)
				}
				cresp.ResultLines = lines
			}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "get":
			if creq.KeyValue.Key == "" {
				cresp.Success = false
				cresp.Result = fmt.Sprint("'get' request got empty key")
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			// TODO: get all keys and by prefix

			cli, _, err := globalCluster.Client(creq.Endpoints...)
			if err != nil {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			defer cli.Close()

			var opts []clientv3.OpOption
			if creq.RangePrefix {
				opts = append(opts, clientv3.WithPrefix(), clientv3.WithPrevKV())
			}
			gresp, err := cli.Get(cctx, creq.KeyValue.Key, opts...)
			if err != nil {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("client error %v (took %v)", err, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
			}
			kvs := make([]KeyValue, len(gresp.Kvs))
			for i := range gresp.Kvs {
				kvs[i] = KeyValue{Key: string(gresp.Kvs[i].Key), Value: string(gresp.Kvs[i].Value)}
			}
			cresp.KeyValues = kvs

			if err == nil {
				cresp.Result = fmt.Sprintf("'get' success (took %v)", roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				lines := make([]string, len(cresp.KeyValues))
				for i := range lines {
					lines[i] = fmt.Sprintf("'get' success (key: %s, value: %s)", cresp.KeyValues[i].Key, cresp.KeyValues[i].Value)
				}
				if len(lines) == 0 {
					lines = append(lines, fmt.Sprintf("key %q does not exist", creq.KeyValue.Key))
				}
				cresp.ResultLines = lines
			}

			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "stop-node":
			if rmsg, ok := globalStopRestartLimiter.Check(); !ok {
				cresp.Success = false
				cresp.Result = "'stop-node' request " + rmsg
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			globalStopRestartLimiter.Advance()

			if globalCluster.IsStopped(idx) {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("%s is already stopped (took %v)", globalCluster.NodeStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			globalCluster.Stop(idx)

			cresp.Result = fmt.Sprintf("stopped %s (took %v)", globalCluster.NodeStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
			cresp.ResultLines = []string{cresp.Result}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "restart-node":
			if rmsg, ok := globalStopRestartLimiter.Check(); !ok {
				cresp.Success = false
				cresp.Result = "'restart-node' request " + rmsg
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			globalStopRestartLimiter.Advance()

			if !globalCluster.IsStopped(idx) {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("%s is already started (took %v)", globalCluster.NodeStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			if rerr := globalCluster.Restart(idx); rerr != nil {
				cresp.Success = false
				cresp.Result = rerr.Error()
			} else {
				cresp.Success = true
				cresp.Result = fmt.Sprintf("restarted %s (took %v)", globalCluster.NodeStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
			}

			cresp.ResultLines = []string{cresp.Result}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		default:
			return fmt.Errorf("unknown action %q", creq.Action)
		}

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
