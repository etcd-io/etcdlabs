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
	"path"
	"strconv"
	"strings"
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
	KeyValues []KeyValue
}

// ClientResponse translates client's GET response in frontend-friendly format.
type ClientResponse struct {
	Success   bool
	Error     string
	KeyValues []KeyValue
}

// clientHandler handles writes, reads, deletes, kill, restart operations.
func clientHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	// TODO: rate limit globally

	// TODO: parse HTML form
	// req.ParseForm()
	resp := ClientResponse{
		Success: true,
		Error:   "",
	}

	ns := strings.Replace(path.Base(req.URL.Path), "node", "", 1)
	idx, err := strconv.Atoi(ns)
	if err != nil {
		return err
	}

	cli, _, err := globalCluster.Client(3*time.Second, idx, globalCluster.Endpoints(idx, false)...)
	if err != nil {
		return err
	}

	switch req.Method {
	case "POST": // stress
		resp.KeyValues = multiRandKeyValues(5, 3, "foo", "bar")
		for _, kv := range resp.KeyValues {
			if _, err := cli.Put(ctx, kv.Key, kv.Value); err != nil {
				resp.Success = false
				resp.Error = err.Error()
				break
			}
		}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	case "PUT": // write
		resp.KeyValues = []KeyValue{{Key: "foo", Value: "bar"}}
		if _, err := cli.Put(ctx, "foo", "bar"); err != nil {
			resp.Success = false
			resp.Error = err.Error()
		}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	case "GET": // read
		if gresp, err := cli.Get(ctx, "foo", clientv3.WithPrefix()); err != nil {
			resp.Success = false
			resp.Error = err.Error()
		} else {
			resp.KeyValues = make([]KeyValue, len(gresp.Kvs))
			for i := range gresp.Kvs {
				resp.KeyValues[i].Key = string(gresp.Kvs[i].Key)
				resp.KeyValues[i].Value = string(gresp.Kvs[i].Value)
			}
		}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			return err
		}

	case "DELETE":

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
