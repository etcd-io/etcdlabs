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
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/golang/glog"
)

var (
	testMu       sync.Mutex
	testBasePort = 35000
)

/*
go test -v -run TestServer -logtostderr=true
*/

func TestServer(t *testing.T) {
	testMu.Lock()
	port := testBasePort
	testBasePort++
	testMu.Unlock()

	srv, err := StartServer(port)
	if err != nil {
		t.Fatal(err)
	}

	tu := srv.addrURL
	tu.Path = "/client-request"

	time.Sleep(7 * time.Second)
	glog.Info("getting server status update...")
	func() {
		resp, err := http.Get(srv.addrURL.String() + "/server-status")
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		sresp := ServerStatus{}
		if err := json.NewDecoder(resp.Body).Decode(&sresp); err != nil {
			t.Fatal(err)
		}
		if len(sresp.MemberStatuses) != 5 {
			t.Fatalf("len(sresp.MemberStatuses) expected 5, got %d", len(sresp.MemberStatuses))
		}
		hash := sresp.MemberStatuses[0].Hash
		for i, s := range sresp.MemberStatuses {
			if hash != s.Hash {
				t.Fatalf("%d: hash expected %d, got different hash %d", i, hash, s.Hash)
			}
		}
		fmt.Printf("'/server-status' response: %+v\n", sresp)
	}()

	println()
	glog.Info("stressing node1...")
	func() {
		req := ClientRequest{
			Action:    "stress",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		if cresp.ClientRequest.Action != "stress" {
			t.Fatalf("client request expected 'stress', got %s", cresp.ClientRequest.Action)
		}
		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
		if len(cresp.KeyValues) != 3 {
			t.Fatalf("expected 3 kvs, got %v", cresp.KeyValues)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)
	}()

	println()
	glog.Info("expecting rate-limit error from node1...")
	func() {
		req := ClientRequest{
			Action:    "stress",
			Endpoints: globalCluster.Endpoints(0, false),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)
	}()

	// remove limiter for testing purposes
	globalClientRequestLimiter.SetInterval(10 * time.Millisecond)

	println()
	time.Sleep(7 * time.Second)
	glog.Info("expecting error from specifying no endpoints...")
	func() {
		req := ClientRequest{
			Action: "stress",
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		if cresp.Result != ErrNoEndpoint {
			t.Fatalf("expected %s, got %s", ErrNoEndpoint, cresp.Result)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("writing to node2...")
	func() {
		req := ClientRequest{
			Action:    "write",
			Endpoints: globalCluster.Endpoints(1, true),
			KeyValue:  KeyValue{Key: "foo", Value: "bar"},
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		// hreq := &http.Request{
		// 	Method: "POST",
		// 	URL:    &tu,
		// 	Body:   ioutil.NopCloser(bytes.NewReader(data)),
		// }
		// resp, err := http.DefaultClient.Do(hreq)
		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("prefix-range from node3...")
	func() {
		req := ClientRequest{
			Action:      "get",
			RangePrefix: true,
			Endpoints:   globalCluster.Endpoints(2, true),
			KeyValue:    KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
		if len(cresp.KeyValues) != 4 {
			t.Fatalf("len(cresp.KeyValues) expected 4, got %v", cresp.KeyValues)
		}
	}()

	println()
	time.Sleep(2 * time.Second)
	glog.Info("delete-prefix from node4...")
	func() {
		req := ClientRequest{
			Action:      "delete",
			RangePrefix: true,
			Endpoints:   globalCluster.Endpoints(3, true),
			KeyValue:    KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("get from node5...")
	func() {
		req := ClientRequest{
			Action:    "get",
			Endpoints: globalCluster.Endpoints(4, true),
			KeyValue:  KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("stop node1...")
	func() {
		req := ClientRequest{
			Action:    "stop-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
		if !strings.Contains(cresp.Result, "stopped ") {
			t.Fatalf("expected 'stopped', got %v", cresp)
		}
	}()

	println()
	glog.Info("expecting rate-limit excess error from stopping node1...")
	func() {
		req := ClientRequest{
			Action:    "stop-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		if !strings.Contains(cresp.Result, "rate limit exceeded") {
			t.Fatalf("expected rate-limit excess, got %v", cresp)
		}
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("expecting errors after stopping same node1...")
	func() {
		req := ClientRequest{
			Action:    "stress",
			Endpoints: globalCluster.Endpoints(0, false),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		if !strings.Contains(cresp.Result, "client error") {
			t.Fatalf("expected 'client error', got %v", cresp)
		}
	}()

	println()
	time.Sleep(5 * time.Second)
	glog.Info("restart node1...")
	func() {
		req := ClientRequest{
			Action:    "restart-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if !cresp.Success {
			t.Fatalf("expected success true, got success %v", cresp.Success)
		}
	}()

	println()
	glog.Info("expected rate-limit excess from restarting node1...")
	func() {
		req := ClientRequest{
			Action:    "restart-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		if !strings.Contains(cresp.Result, "rate limit exceeded") {
			t.Fatalf("expected rate-limit excess, got %v", cresp)
		}
	}()

	println()
	time.Sleep(7 * time.Second)
	glog.Info("expected errors from restarting same node1...")
	func() {
		req := ClientRequest{
			Action:    "restart-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(req)
		if err != nil {
			t.Fatal(err)
		}

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()

		cresp := ClientResponse{}
		if err := json.NewDecoder(resp.Body).Decode(&cresp); err != nil {
			t.Fatal(err)
		}
		fmt.Printf("'/client-request' POST response: %+v\n", cresp)

		if cresp.Success {
			t.Fatalf("expected success false, got success %v", cresp.Success)
		}
		if !strings.Contains(cresp.Result, "already started") {
			t.Fatalf("expected 'already started', got %v", cresp)
		}
	}()

	glog.Info("DONE!")

	srv.Stop()
}
