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
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"sort"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster/clusterpb"

	"github.com/coreos/etcd/clientv3"
	humanize "github.com/dustin/go-humanize"
	"github.com/golang/glog"
)

type key int

const userKey key = 0

type userData struct {
	lastActive time.Time
}

var (
	globalUserCacheLock sync.RWMutex
	globalUserCache     = make(map[string]userData)
)

var globalStatusInterval = time.Second

func updateClusterStatus(stopc <-chan struct{}) {
	for {
		select {
		case <-stopc:
			return
		case <-time.After(globalStatusInterval):
		}

		if len(globalUserCache) == 0 {
			// glog.Info("no user online")
			continue
		}
		globalCluster.UpdateMemberStatus()
	}
}

func cleanCache(stopc <-chan struct{}) {
	for {
		select {
		case <-stopc:
			return
		case <-time.After(5 * time.Minute):
		}

		globalUserCacheLock.Lock()
		for k, v := range globalUserCache {
			since := time.Since(v.lastActive)
			if since > 15*time.Minute {
				glog.Infof("removing inactive user %q (last active %v)", k, since)
				delete(globalUserCache, k)
			}
		}
		globalUserCacheLock.Unlock()
	}
}

func withCache(h ContextHandler) ContextHandler {
	return ContextHandlerFunc(func(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
		userID := generateUserID(req)
		globalServerVisitsMu.Lock()
		globalServerVisits.Insert([]byte(fmt.Sprintf("%s%016X", userID, time.Now().Unix())))
		globalServerVisitsMu.Unlock()
		ctx = context.WithValue(ctx, userKey, &userID)

		globalUserCacheLock.Lock()
		if _, ok := globalUserCache[userID]; !ok { // if user visits first time, create user cache
			glog.Infof("just created user %q", userID)
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
	case http.MethodGet:
		resp := Connect{WebPort: globalWebserverPort, User: userID, Deleted: false}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	case http.MethodDelete: // user leaves component
		glog.Infof("user %q just left (user deleted)", userID)
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

	// ServerVisits is the number visits since last deploy.
	ServerVisits uint64

	// UserN is the number of online users.
	UserN int

	// Users is a slice of users with real IPs being masked.
	// Maximum 20 users are returned.
	Users []string

	// MemberStatuses contains all node statuses.
	MemberStatuses []clusterpb.MemberStatus
}

func getUserIDs() []string {
	globalUserCacheLock.RLock()
	s := make([]string, 0, len(globalUserCache))
	for id := range globalUserCache {
		s = append(s, maskUserID(id))
		if len(s) > 20 {
			break
		}
	}
	globalUserCacheLock.RUnlock()

	sort.Strings(s)
	return s
}

func getUserIDsN() (n int) {
	globalUserCacheLock.RLock()
	n = len(globalUserCache)
	globalUserCacheLock.RUnlock()
	return
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case http.MethodGet:
		user := ctx.Value(userKey).(*string)
		userID := *user
		globalUserCacheLock.Lock()
		_, active := globalUserCache[userID]
		if active {
			globalUserCache[userID] = userData{lastActive: time.Now()}
		}
		globalUserCacheLock.Unlock()

		active = active && globalCluster != nil

		globalServerVisitsMu.Lock()
		vnum := globalServerVisits.Estimate()
		globalServerVisitsMu.Unlock()
		resp := ServerStatus{
			PlaygroundActive: active,
			ServerUptime:     humanize.Time(globalCluster.Started),
			ServerVisits:     vnum,
			UserN:            getUserIDsN(),
			Users:            getUserIDs(),
			MemberStatuses:   globalCluster.AllMemberStatus(),
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
	case http.MethodPost:
		cresp := ClientResponse{Success: true}
		defer func() {
			glog.Info(cresp.Result)
		}()
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

			if globalCluster.ActiveNodeN() < globalCluster.Quorum() {
				cresp.Success = false
				cresp.Result = "'stop-node' request rejected (already quorum lost!)"
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}

			glog.Infof("starting 'stop-node' on %q(%s)", globalCluster.MemberStatus(idx).Name, globalCluster.MemberStatus(idx).ID)
			if globalCluster.IsStopped(idx) {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("%s is already stopped (took %v)", globalCluster.MemberStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				return json.NewEncoder(w).Encode(cresp)
			}
			globalCluster.Stop(idx)
			glog.Infof("finished 'stop-node' on %q(%s)", globalCluster.MemberStatus(idx).Name, globalCluster.MemberStatus(idx).ID)

			cresp.Result = fmt.Sprintf("stopped %s (took %v)", globalCluster.MemberStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
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

			glog.Infof("starting 'restart-node' on %q(%s)", globalCluster.MemberStatus(idx).Name, globalCluster.MemberStatus(idx).ID)
			if !globalCluster.IsStopped(idx) {
				cresp.Success = false
				cresp.Result = fmt.Sprintf("%s is already started (took %v)", globalCluster.MemberStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
				cresp.ResultLines = []string{cresp.Result}
				glog.Warningf("'restart-node' %s", cresp.Result)
				return json.NewEncoder(w).Encode(cresp)
			}

			if rerr := globalCluster.Restart(idx); rerr != nil {
				glog.Warningf("'restart-node' error %v", rerr)
				cresp.Success = false
				cresp.Result = rerr.Error()
			} else {
				cresp.Success = true
				cresp.Result = fmt.Sprintf("restarted %s (took %v)", globalCluster.MemberStatus(idx).Name, roundDownDuration(time.Since(reqStart), minScaleToDisplay))
			}
			glog.Infof("finished 'restart-node' on %q(%s)", globalCluster.MemberStatus(idx).Name, globalCluster.MemberStatus(idx).ID)

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
