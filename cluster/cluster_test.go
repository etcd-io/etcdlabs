package cluster

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"reflect"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/pkg/transport"
)

var testTLS = transport.TLSInfo{
	TrustedCAFile:  "../test-certs/trusted-ca.pem",
	CertFile:       "../test-certs/test-cert.pem",
	KeyFile:        "../test-certs/test-cert-key.pem",
	ClientCertAuth: true,
}

type keyValue struct {
	key string
	val string
}

var basePort uint32 = 1300

/*
func TestCluster_Start_no_TLS(t *testing.T) {
	testCluster(t, Config{Size: 3}, false, false)
}

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
*/

func TestCluster_Recover_peer_client_manual_TLS_scheme(t *testing.T) {
	testCluster(t, Config{Size: 3, PeerTLSInfo: testTLS, ClientTLSInfo: testTLS}, true, true)
}

func testCluster(t *testing.T, cfg Config, scheme, stopRecover bool) {
	dir, err := ioutil.TempDir(os.TempDir(), "cluster-test")
	if err != nil {
		t.Fatal(err)
	}
	cfg.RootDir = dir
	cfg.RootPort = int(atomic.LoadUint32(&basePort))

	if cfg.RootCtx == nil || cfg.RootCancel == nil {
		rootCtx, rootCancel := context.WithCancel(context.Background())
		defer rootCancel()
		cfg.RootCtx = rootCtx
		cfg.RootCancel = rootCancel
	}

	atomic.AddUint32(&basePort, 10)

	println()
	println()
	println()
	fmt.Println("starting cluster")
	c, err := Start(cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		println()
		println()
		println()
		fmt.Println("shutting down the cluster")
		c.Shutdown()
	}()

	ks := []keyValue{
		{key: "foo1", val: "bar1"},
		{key: "foo2", val: "bar2"},
		{key: "foo3", val: "bar3"},
	}
	func() {
		println()
		println()
		println()
		fmt.Println("making write requests")
		cli, _, err := c.Client(c.AllEndpoints(scheme)...)
		if err != nil {
			t.Fatal(err)
		}
		defer cli.Close()

		for i, kv := range ks {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			_, err = cli.Put(ctx, kv.key, kv.val)
			cancel()
			if err != nil {
				t.Fatalf("%d: PUT failed %v", i, err)
			}
			time.Sleep(time.Second)
		}
	}()

	println()
	println()
	println()
	fmt.Println("calling UpdateMemberStatus")
	c.UpdateMemberStatus()
	hashes1 := make([]int, len(c.Members))
	for i := range c.Members {
		hashes1[i] = c.Members[i].status.Hash
	}

	if stopRecover {
		println()
		println()
		println()
		fmt.Println("stopping leader")
		leadidx := c.LeadIdx
		c.Stop(leadidx)
		time.Sleep(time.Second)

		if err := c.WaitForLeader(); err != nil {
			t.Fatal(err)
		}

		println()
		println()
		println()
		fmt.Println("recovering old leader")
		if err = c.Restart(leadidx); err != nil {
			t.Fatal(err)
		}
		time.Sleep(time.Second)

		if err := c.WaitForLeader(); err != nil {
			t.Fatal(err)
		}
	}

	println()
	println()
	println()
	fmt.Println("calling UpdateMemberStatus")
	c.UpdateMemberStatus()
	hashes2 := make([]int, len(c.Members))
	for i := range c.Members {
		hashes2[i] = c.Members[i].status.Hash
	}
	if !reflect.DeepEqual(hashes1, hashes2) {
		t.Fatalf("hashes1 %v != hashes2 %v", hashes1, hashes2)
	}

	func() {
		println()
		println()
		println()
		fmt.Println("making read requests")
		cli, _, err := c.Client(c.AllEndpoints(scheme)...)
		if err != nil {
			t.Fatal(err)
		}
		defer cli.Close()

		for i, kv := range ks {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			var resp *clientv3.GetResponse
			resp, err = cli.Get(ctx, kv.key)
			cancel()
			if err != nil {
				t.Fatalf("%d: GET failed %v", i, err)
			}
			if string(resp.Kvs[0].Key) != kv.key {
				t.Fatalf("#%d: key expected %q, got %q", i, kv.key, string(resp.Kvs[0].Key))
			}
			if string(resp.Kvs[0].Value) != kv.val {
				t.Fatalf("#%d: value expected %q, got %q", i, kv.val, string(resp.Kvs[0].Value))
			}
			time.Sleep(time.Second)
		}
	}()

	println()
	println()
	println()
	fmt.Println("calling UpdateMemberStatus")
	c.UpdateMemberStatus()
	hashes3 := make([]int, len(c.Members))
	for i := range c.Members {
		hashes3[i] = c.Members[i].status.Hash
	}
	if !reflect.DeepEqual(hashes1, hashes3) {
		t.Fatalf("hashes1 %v != hashes3 %v", hashes1, hashes3)
	}

	func() {
		println()
		println()
		println()
		fmt.Println("adding a new member")
		if err := c.Add(); err != nil {
			t.Fatal(err)
		}
		if err := c.WaitForLeader(); err != nil {
			t.Fatal(err)
		}
	}()

	println()
	println()
	println()
	for i, st := range c.AllMemberStatus() {
		fmt.Printf("Member Status: %q, %+v\n", c.Members[i].cfg.Name, st)
	}

	func() {
		time.Sleep(5 * time.Second)
		if err := c.WaitForLeader(); err != nil {
			t.Fatal(err)
		}
		println()
		println()
		println()
		fmt.Println("removing the member")
		leadidx := c.LeadIdx
		if err := c.Remove(leadidx); err != nil {
			t.Fatal(err)
		}
		if err := c.WaitForLeader(); err != nil {
			t.Fatal(err)
		}
	}()

	println()
	println()
	println()
	for i, st := range c.AllMemberStatus() {
		fmt.Printf("Member Status: %q, %+v\n", c.Members[i].cfg.Name, st)
	}
}
