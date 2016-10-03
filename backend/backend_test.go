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
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/coreos/pkg/capnslog"
)

var (
	testMu       sync.Mutex
	testBasePort = 8080
)

func Test_StartServer(t *testing.T) {
	testMu.Lock()
	port := testBasePort
	testBasePort++
	testMu.Unlock()

	srv, err := StartServer(port)
	if err != nil {
		t.Fatal(err)
	}

	// wait until first server status update
	time.Sleep(2 * time.Second)

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

	time.Sleep(time.Second)
	{
		tu := srv.addrURL
		tu.Path = "/client/node-1"
		resp, err := http.Post(tu.String(), "", nil)
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client/node-1' POST response:", string(b))
	}

	time.Sleep(2 * time.Second)
	{
		tu := srv.addrURL
		tu.Path = "/client/node-2"
		req := &http.Request{Method: "PUT", URL: &tu}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client/node-2' PUT response:", string(b))
	}

	time.Sleep(2 * time.Second)
	{
		resp, err := http.Get(srv.addrURL.String() + "/client/node-3")
		if err != nil {
			t.Fatal(err)
		}
		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			resp.Body.Close()
			t.Fatal(err)
		}
		resp.Body.Close()
		fmt.Println("'/client/node-3' GET response:", string(b))
	}

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	defer capnslog.SetGlobalLogLevel(testLogLevel)
	srv.Stop()
}
