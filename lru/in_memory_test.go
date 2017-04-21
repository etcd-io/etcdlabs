package lru

import (
	"fmt"
	"testing"
)

func TestNewInMemory(t *testing.T) {
	c := NewInMemory(3)
	if err := c.Put("test-bucket", "foo", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("test-bucket", "foo1", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("test-bucket", "foo2", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("test-bucket", "foo3", "bar"); err != nil {
		t.Fatal(err)
	}
	if v, err := c.Get("test-bucket", "foo3"); err != nil || fmt.Sprint(v) != "bar" {
		t.Fatal(err)
	}
	if _, err := c.Get("wrong-bucket", "foo"); err != ErrNamespaceNotFound {
		t.Fatalf("expected eviction with %v, got %v", ErrNamespaceNotFound, err)
	}
	if _, err := c.Get("test-bucket", "foo"); err != ErrKeyNotFound {
		t.Fatalf("expected eviction with %v, got %v", ErrKeyNotFound, err)
	}
}
