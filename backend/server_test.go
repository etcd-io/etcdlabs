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
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
	"testing"
	"time"
)

var (
	testMu       sync.Mutex
	testBasePort = 8080
)

func TestServer(t *testing.T) {
	testMu.Lock()
	port := testBasePort
	testBasePort++
	testMu.Unlock()

	srv, err := StartServer(port)
	if err != nil {
		t.Fatal(err)
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("getting server status update...")
	{
		resp, err := http.Get(srv.addrURL.String() + "/server-status")
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/server-status' response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("expecting errors...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action: "stress",
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("stressing node1...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "stress",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("writing to node2...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "write",
			Endpoints: globalCluster.Endpoints(1, true),
			KeyValue:  KeyValue{Key: "foo", Value: "bar"},
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

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
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("prefix-range from node3...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:      "get",
			RangePrefix: true,
			Endpoints:   globalCluster.Endpoints(2, true),
			KeyValue:    KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("delete-prefix from node4...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:      "delete",
			RangePrefix: true,
			Endpoints:   globalCluster.Endpoints(3, true),
			KeyValue:    KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("get from node5...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "get",
			Endpoints: globalCluster.Endpoints(4, true),
			KeyValue:  KeyValue{Key: "foo"},
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("stop node1...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "stop-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("expecting errors after stopping node1...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "stress",
			Endpoints: globalCluster.Endpoints(0, false),
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	println()
	time.Sleep(time.Second)
	fmt.Println("restart node1...")
	{
		tu := srv.addrURL
		tu.Path = "/client-request"

		req := ClientRequest{
			Action:    "restart-node",
			Endpoints: globalCluster.Endpoints(0, true),
		}
		data, err := json.Marshal(&req)
		if err != nil {
			t.Fatal(err)
		}
		fmt.Println("'/client-request' POST request:", string(data))

		resp, err := http.Post(tu.String(), "application/json", bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client-request' POST response:", string(b))
	}

	fmt.Println("DONE!")

	// capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	// defer capnslog.SetGlobalLogLevel(testLogLevel)
	srv.Stop()
}
