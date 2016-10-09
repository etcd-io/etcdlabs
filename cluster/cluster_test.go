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

package cluster

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/pkg/transport"
	"github.com/coreos/pkg/capnslog"
)

var testTLS = transport.TLSInfo{
	CertFile:       "../test-certs/test-cert.pem",
	KeyFile:        "../test-certs/test-cert-key.pem",
	TrustedCAFile:  "../test-certs/trusted-ca.pem",
	ClientCertAuth: true,
}

var (
	bmu      sync.Mutex
	basePort = 1300
)

func TestCluster_Start_no_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3}, false, false)
}

func TestCluster_Start_peer_manual_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3, PeerTLSInfo: testTLS}, false, false)
}

func TestCluster_Start_peer_auto_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3, PeerAutoTLS: true}, false, false)
}

func TestCluster_Start_client_manual_TLS_no_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientTLSInfo: testTLS}, false, false)
}

func TestCluster_Start_client_manual_TLS_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientTLSInfo: testTLS}, true, false)
}

func TestCluster_Start_client_auto_TLS_no_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientAutoTLS: true}, false, false)
}

func TestCluster_Start_client_auto_TLS_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientAutoTLS: true}, true, false)
}

func TestCluster_Recover_no_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3}, false, true)
}

func TestCluster_Recover_peer_manual_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3, PeerTLSInfo: testTLS}, false, true)
}

func TestCluster_Recover_peer_auto_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3, PeerAutoTLS: true}, false, true)
}

func TestCluster_Recover_client_manual_TLS_no_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientTLSInfo: testTLS}, false, true)
}

func TestCluster_Recover_client_manual_TLS_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientTLSInfo: testTLS}, true, true)
}

func TestCluster_Recover_client_auto_TLS_no_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientAutoTLS: true}, false, true)
}

func TestCluster_Recover_client_auto_TLS_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, ClientAutoTLS: true}, true, true)
}

func testCluster(t *testing.T, cfg Config, scheme, stopRecover bool) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}
	cfg.RootDir = dir
	cfg.RootPort = basePort

	if cfg.RootCtx == nil || cfg.RootCancel == nil {
		rootCtx, rootCancel := context.WithCancel(context.Background())
		defer rootCancel()
		cfg.RootCtx = rootCtx
		cfg.RootCancel = rootCancel
	}

	bmu.Lock()
	basePort += 10
	bmu.Unlock()

	c, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
		defer capnslog.SetGlobalLogLevel(testLogLevel)
		c.Shutdown()
	}()

	cli, _, err := c.Client(c.AllEndpoints(scheme)...)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	_, err = cli.Put(ctx, "foo", "bar")
	cancel()
	if err != nil {
		cli.Close()
		t.Fatal(err)
	}
	cli.Close()
	time.Sleep(time.Second)

	if stopRecover {
		c.Stop(0)
		time.Sleep(time.Second)

		if err = c.Restart(0); err != nil {
			t.Fatal(err)
		}
		time.Sleep(time.Second)
	}

	cli, _, err = c.Client(c.AllEndpoints(scheme)...)
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()

	ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
	var resp *clientv3.GetResponse
	resp, err = cli.Get(ctx, "foo")
	cancel()
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(resp.Kvs[0].Key, []byte("foo")) {
		t.Fatalf("key expected 'foo', got %q", resp.Kvs[0].Key)
	}
	if !bytes.Equal(resp.Kvs[0].Value, []byte("bar")) {
		t.Fatalf("value expected 'bar', got %q", resp.Kvs[0].Key)
	}

	time.Sleep(time.Second)

	for i, st := range c.AllNodeStatus() {
		fmt.Printf("%s: %+v\n", c.nodes[i].cfg.Name, st)
	}

	fmt.Println("DONE!")
}
