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
	"net/http"
	"time"

	"github.com/coreos/etcd/clientv3"
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

// ServerStatus defines server status.
// Encode without json tags to make it parsable by Typescript.
type ServerStatus struct {
	// ServerUptime is the duration since last deploy.
	ServerUptime string
	// NodeStatuses contains all node statuses.
	NodeStatuses []cluster.NodeStatus
}

func serverStatusHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		ss := ServerStatus{
			ServerUptime: humanize.Time(globalCluster.Started),
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

// KeyValue defines key-value pair.
type KeyValue struct {
	Key   string
	Value string
}

// ClientRequest defines client requests.
type ClientRequest struct {
	Action      string // 'stress', 'write', 'get', 'delete', 'stop-node', 'restart-node'
	RangePrefix bool   // 'get', 'delete'
	Endpoints   []string
	KeyValue    KeyValue
}

// ClientResponse translates client's GET response in frontend-friendly format.
type ClientResponse struct {
	ClientRequest ClientRequest
	Success       bool
	Error         string
	KeyValues     []KeyValue
}

// clientRequestHandler handles writes, reads, deletes, kill, restart operations.
// TODO: rate limit globally
func clientRequestHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "POST":
		creq := ClientRequest{}
		if err := json.NewDecoder(req.Body).Decode(&creq); err != nil {
			return err
		}
		defer req.Body.Close()
		if len(creq.Endpoints) == 0 {
			return fmt.Errorf("no endpoint is given (%v)", creq)
		}
		cctx, ccancel := context.WithTimeout(ctx, 3*time.Second)
		defer ccancel()

		idx := globalCluster.FindIndexByClientEndpoint(creq.Endpoints[0])
		if idx == -1 {
			return fmt.Errorf("wrong endpoints are given (%v)", creq.Endpoints)
		}

		switch creq.Action {
		case "stress":
			cli, _, err := globalCluster.Client(3*time.Second, idx, creq.Endpoints...)
			if err != nil {
				return err
			}
			defer cli.Close()

			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
				KeyValues:     multiRandKeyValues(5, 3, "foo", "bar"),
			}
			for _, kv := range cresp.KeyValues {
				if _, err := cli.Put(cctx, kv.Key, kv.Value); err != nil {
					cresp.Success = false
					cresp.Error = err.Error()
					break
				}
			}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "write":
			if creq.KeyValue.Key == "" {
				return fmt.Errorf("write request got empty key %v", creq.KeyValue)
			}

			cli, _, err := globalCluster.Client(3*time.Second, idx, creq.Endpoints...)
			if err != nil {
				return err
			}
			defer cli.Close()

			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
				KeyValues:     []KeyValue{creq.KeyValue},
			}
			if _, err := cli.Put(cctx, creq.KeyValue.Key, creq.KeyValue.Value); err != nil {
				cresp.Success = false
				cresp.Error = err.Error()
			}
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "get":
			if creq.KeyValue.Key == "" {
				return fmt.Errorf("get request got empty key %v", creq.KeyValue)
			}

			cli, _, err := globalCluster.Client(3*time.Second, idx, creq.Endpoints...)
			if err != nil {
				return err
			}
			defer cli.Close()

			var opts []clientv3.OpOption
			if creq.RangePrefix {
				opts = append(opts, clientv3.WithPrefix(), clientv3.WithPrevKV())
			}
			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
			}
			gresp, err := cli.Get(cctx, creq.KeyValue.Key, opts...)
			if err != nil {
				cresp.Success = false
				cresp.Error = err.Error()
			}
			kvs := make([]KeyValue, len(gresp.Kvs))
			for i := range gresp.Kvs {
				kvs[i] = KeyValue{Key: string(gresp.Kvs[i].Key), Value: string(gresp.Kvs[i].Value)}
			}
			cresp.KeyValues = kvs
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "delete":
			if creq.KeyValue.Key == "" {
				return fmt.Errorf("delete request got empty key %v", creq.KeyValue)
			}

			cli, _, err := globalCluster.Client(3*time.Second, idx, creq.Endpoints...)
			if err != nil {
				return err
			}
			defer cli.Close()

			var opts []clientv3.OpOption
			if creq.RangePrefix {
				opts = append(opts, clientv3.WithPrefix(), clientv3.WithPrevKV())
			}
			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
			}
			dresp, err := cli.Delete(cctx, creq.KeyValue.Key, opts...)
			if err != nil {
				cresp.Success = false
				cresp.Error = err.Error()
			}
			kvs := make([]KeyValue, len(dresp.PrevKvs))
			for i := range dresp.PrevKvs {
				kvs[i] = KeyValue{Key: string(dresp.PrevKvs[i].Key), Value: string(dresp.PrevKvs[i].Value)}
			}
			cresp.KeyValues = kvs
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "stop-node":
			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
			}
			globalCluster.Stop(idx)
			if err := json.NewEncoder(w).Encode(cresp); err != nil {
				return err
			}

		case "restart-node":
			cresp := &ClientResponse{
				ClientRequest: creq,
				Success:       true,
			}
			if rerr := globalCluster.Restart(idx); rerr != nil {
				cresp.Success = false
				cresp.Error = rerr.Error()
			}
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
