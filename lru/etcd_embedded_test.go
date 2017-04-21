package lru

import (
	"bytes"
	"context"
	"reflect"
	"testing"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/etcdserver/api/v3client"
)

func TestEtcdEmbeddedNamespace(t *testing.T) {
	// c := NewEtcdEmbedded(5, 9999, 9990, "")
	// if err := c.Start(); err != nil {
	// 	t.Fatal(err)
	// }
	// defer func() {
	// 	if err := c.Shutdown(); err != nil {
	// 		t.Log(err)
	// 	}
	// }()

	// cli := v3client.New(ec.e.Server)
	// defer cli.Close()

	// unprefixedKV := cli.KV

	// cli.KV = namespace.NewKV(cli.KV, "bucket1")
	// // cli.Watcher = namespace.NewWatcher(cli.Watcher, "my-prefix/")
	// // cli.Lease = namespace.NewLease(cli.Lease, "my-prefix/")
	// _, err = cli.Put(context.TODO(), "abc", "123")
	// if err != nil {
	// 	t.Fatal(err)
	// }
	// resp, gerr := cli.Get(context.TODO(), "abc")
	// if gerr != nil {
	// 	t.Fatal(gerr)
	// }
	// fmt.Printf("%+v\n", resp)
}

func TestEtcdEmbeddedRevision(t *testing.T) {
	c := NewEtcdEmbedded(5, 3333, 3338, "")
	if err := c.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if err := c.Shutdown(); err != nil {
			t.Log(err)
		}
	}()
	ec, ok := c.(*etcdEmbedded)
	if !ok {
		t.Fatalf("expected *etcdEmbedded, got %v", reflect.TypeOf(c))
	}

	cli := v3client.New(ec.e.Server)
	defer cli.Close()

	checkPut(t, cli, checkOpt{key: "foo", val: "bar1", expectedRev: 2})
	checkPut(t, cli, checkOpt{key: "foo", val: "bar2", expectedRev: 3, prev: true, expectedPrevVer: 1})
	checkGet(t, cli, checkOpt{key: "foo", val: "bar1", rangeRev: 2, expectedRev: 3, expectedVer: 1})
	checkGet(t, cli, checkOpt{key: "foo", val: "bar2", expectedRev: 3, expectedVer: 2})

	// compacted away the first version
	if _, cerr := cli.Compact(context.Background(), 2, clientv3.WithCompactPhysical()); cerr != nil {
		t.Fatal(cerr)
	}
	checkGet(t, cli, checkOpt{key: "foo", val: "bar2", expectedRev: 3, expectedVer: 2})

	// compacted away the last version
	if _, cerr := cli.Compact(context.Background(), 3, clientv3.WithCompactPhysical()); cerr != nil {
		t.Fatal(cerr)
	}
	checkGet(t, cli, checkOpt{key: "foo", val: "bar2", expectedRev: 3, expectedVer: 2})

	checkPut(t, cli, checkOpt{key: "foo", val: "bar3", expectedRev: 4, prev: true, expectedPrevVer: 2})
	checkGet(t, cli, checkOpt{key: "foo", val: "bar3", expectedRev: 4, expectedVer: 3})
}

func checkPut(t *testing.T, cli *clientv3.Client, copt checkOpt) {
	resp, err := cli.Put(context.Background(), copt.key, copt.val, clientv3.WithPrevKV())
	if err != nil {
		t.Fatal(err)
	}
	if resp.Header.Revision != copt.expectedRev {
		t.Fatalf("revision expected %d, got %d", copt.expectedRev, resp.Header.Revision)
	}
	if copt.prev {
		if resp.PrevKv == nil {
			t.Fatalf("expected non-nil PrevKv, got %v", resp.PrevKv)
		}
		if resp.PrevKv.Version != copt.expectedPrevVer {
			t.Fatalf("prev version expected %d, got %d", copt.expectedPrevVer, resp.PrevKv.Version)
		}
	}
}

type checkOpt struct {
	key, val string
	rangeRev int64

	expectedRev int64
	expectedVer int64

	prev            bool
	expectedPrevVer int64
}

func checkGet(t *testing.T, cli *clientv3.Client, copt checkOpt) {
	opts := []clientv3.OpOption{clientv3.WithSerializable()}
	if copt.rangeRev > 0 {
		opts = append(opts, clientv3.WithRev(copt.rangeRev))
	}
	resp, err := cli.Get(context.Background(), copt.key, opts...)
	if err != nil {
		t.Fatal(err)
	}
	if resp.Header.Revision != copt.expectedRev {
		t.Fatalf("revision expected %d, got %d", copt.expectedRev, resp.Header.Revision)
	}
	if len(resp.Kvs) != 1 {
		t.Fatalf("len(resp.Kvs) expected 1, got %d", len(resp.Kvs))
	}
	if !bytes.Equal(resp.Kvs[0].Key, []byte(copt.key)) {
		t.Fatalf("resp.Kvs[0].Key expected  %q, got %q", copt.key, string(resp.Kvs[0].Key))
	}
	if !bytes.Equal(resp.Kvs[0].Value, []byte(copt.val)) {
		t.Fatalf("resp.Kvs[0].Value expected %q, got %q", copt.val, string(resp.Kvs[0].Value))
	}
	if resp.Kvs[0].Version != copt.expectedVer {
		t.Fatalf("resp.Kvs[0].Version expected %d, got %d", copt.expectedVer, resp.Kvs[0].Version)
	}
}

func TestEtcdEmbeddedCache(t *testing.T) {
	c := NewEtcdEmbedded(5, 7777, 7778, "")
	if err := c.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if err := c.Shutdown(); err != nil {
			t.Log(err)
		}
	}()

	if err := c.Put("test-bucket", "foo", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("test-bucket", "foo", "bar2"); err != nil {
		t.Fatal(err)
	}
	if _, err := c.Get("test-bucket", "foo1"); err != ErrKeyNotFound {
		t.Fatalf("expected %v, got %v", ErrKeyNotFound, err)
	}

	v, err := c.Get("test-bucket", "foo")
	if err != nil {
		t.Fatal(err)
	}
	vb, ok := v.([]byte)
	if !ok {
		t.Fatalf("expected bytes, got %v", reflect.TypeOf(v))
	}
	if !bytes.Equal(vb, []byte("bar2")) {
		t.Fatalf("value expected 'bar2', got %q", string(vb))
	}
}
