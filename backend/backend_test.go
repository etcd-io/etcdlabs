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

	resp, err := http.Get(srv.addr + "/start")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(string(b))

	time.Sleep(time.Second)

	srv.Stop()
}
