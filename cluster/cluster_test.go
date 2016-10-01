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
	"io/ioutil"
	"os"
	"testing"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/pkg/transport"
)

var testTLSInfo = transport.TLSInfo{
	CertFile:       "../test-certs/test-cert.pem",
	KeyFile:        "../test-certs/test-cert-key.pem",
	TrustedCAFile:  "../test-certs/trusted-ca.pem",
	ClientCertAuth: true,
}

func testClusterStart(t *testing.T, cfg Config, scheme bool) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}
	cfg.RootDir = dir

	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer cl.Shutdown()

	// wait until cluster is ready
	time.Sleep(time.Second)

	ccfg := clientv3.Config{
		Endpoints:   cl.EndpointsAll(scheme),
		DialTimeout: 3 * time.Second,
	}

	switch {
	case !cfg.ClientTLSInfo.Empty():
		tlsConfig, err := cfg.ClientTLSInfo.ClientConfig()
		if err != nil {
			t.Fatal(err)
		}
		ccfg.TLS = tlsConfig

	case !cl.cfgs[0].ClientTLSInfo.Empty():
		tlsConfig, err := cl.cfgs[0].ClientTLSInfo.ClientConfig()
		if err != nil {
			t.Fatal(err)
		}
		ccfg.TLS = tlsConfig
	}

	cli, err := clientv3.New(ccfg)
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()

	if _, err = cli.Put(context.TODO(), "foo", "bar"); err != nil {
		t.Fatal(err)
	}

	// wait until the value is ready
	time.Sleep(time.Second)

	var resp *clientv3.GetResponse
	resp, err = cli.Get(context.TODO(), "foo")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(resp.Kvs[0].Key, []byte("foo")) {
		t.Fatalf("key expected 'foo', got %q", resp.Kvs[0].Key)
	}
	if !bytes.Equal(resp.Kvs[0].Value, []byte("bar")) {
		t.Fatalf("value expected 'bar', got %q", resp.Kvs[0].Key)
	}
}

func TestClusterStartNoTLS(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 1379}, false)
}

func TestClusterStartPeerTLSManual(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 2379, PeerTLSInfo: testTLSInfo}, false)
}

func TestClusterStartPeerTLSAuto(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 3379, PeerAutoTLS: true}, false)
}

func TestClusterStartClientTLSManual(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 4379, ClientTLSInfo: testTLSInfo}, false)
}

func TestClusterStartClientTLSManualScheme(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 5379, ClientTLSInfo: testTLSInfo}, true)
}

func TestClusterStartClientTLSAuto(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 6379, ClientAutoTLS: true}, false)
}

func TestClusterStartClientTLSAutoScheme(t *testing.T) {
	testClusterStart(t, Config{Size: 3, RootPort: 7379, ClientAutoTLS: true}, true)
}
