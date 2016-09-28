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
	"github.com/coreos/pkg/capnslog"
)

var testTLSInfo = transport.TLSInfo{
	CertFile:       "../test-certs/test-cert.pem",
	KeyFile:        "../test-certs/test-cert-key.pem",
	TrustedCAFile:  "../test-certs/trusted-ca.pem",
	ClientCertAuth: true,
}

func TestClusterStart(t *testing.T) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		Size:     3,
		RootDir:  dir,
		RootPort: 1379,
	}
	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}

	// wait until cluster is ready
	time.Sleep(time.Second)

	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cl.GetAllClientEndpoints(),
		DialTimeout: 3 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()
	_, err = cli.Put(context.TODO(), "foo", "bar")
	if err != nil {
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

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	cl.Shutdown()
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}

func TestClusterStartPeerTLS(t *testing.T) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		Size:     3,
		RootDir:  dir,
		RootPort: 2379,

		PeerAutoTLS: false,
		PeerTLSInfo: testTLSInfo,
	}
	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}

	// wait until cluster is ready
	time.Sleep(time.Second)

	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cl.GetAllClientEndpoints(),
		DialTimeout: 3 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()
	_, err = cli.Put(context.TODO(), "foo", "bar")
	if err != nil {
		t.Fatal(err)
	}

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	cl.Shutdown()
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}

func TestClusterStartPeerTLSAuto(t *testing.T) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		Size:     3,
		RootDir:  dir,
		RootPort: 3379,

		PeerAutoTLS: true,
	}
	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}

	// wait until cluster is ready
	time.Sleep(time.Second)

	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cl.GetAllClientEndpoints(),
		DialTimeout: 3 * time.Second,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()
	_, err = cli.Put(context.TODO(), "foo", "bar")
	if err != nil {
		t.Fatal(err)
	}

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	cl.Shutdown()
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}

func TestClusterStartClientTLS(t *testing.T) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		Size:     1,
		RootDir:  dir,
		RootPort: 4379,

		ClientAutoTLS: false,
		ClientTLSInfo: testTLSInfo,
	}
	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}

	// wait until cluster is ready
	time.Sleep(time.Second)

	tlsConfig, err := testTLSInfo.ClientConfig()
	if err != nil {
		t.Fatal(err)
	}
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cl.GetAllClientEndpoints(),
		DialTimeout: 3 * time.Second,
		TLS:         tlsConfig,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()
	_, err = cli.Put(context.TODO(), "foo", "bar")
	if err != nil {
		t.Fatal(err)
	}

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	cl.Shutdown()
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}

func TestClusterStartClientTLSAuto(t *testing.T) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		Size:     1,
		RootDir:  dir,
		RootPort: 4379,

		ClientAutoTLS: true,
	}
	cl, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}

	// wait until cluster is ready
	time.Sleep(time.Second)

	tlsConfig, err := cl.cfgs[0].ClientTLSInfo.ClientConfig()
	if err != nil {
		t.Fatal(err)
	}
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   cl.GetAllClientEndpoints(),
		DialTimeout: 3 * time.Second,
		TLS:         tlsConfig,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer cli.Close()
	_, err = cli.Put(context.TODO(), "foo", "bar")
	if err != nil {
		t.Fatal(err)
	}

	capnslog.SetGlobalLogLevel(capnslog.CRITICAL)
	cl.Shutdown()
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}
