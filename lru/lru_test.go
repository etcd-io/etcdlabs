package lru

import (
	"fmt"
	"testing"
)

func TestNewInMemory(t *testing.T) {
	c := NewInMemory(3)
	if err := c.Put("foo", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("foo1", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("foo2", "bar"); err != nil {
		t.Fatal(err)
	}
	if err := c.Put("foo3", "bar"); err != nil {
		t.Fatal(err)
	}
	if v, err := c.Get("foo3"); err != nil || fmt.Sprint(v) != "bar" {
		t.Fatal(err)
	}
	if _, err := c.Get("foo"); err != ErrKeyNotFound {
		t.Fatalf("expected eviction with %v, got %v", ErrKeyNotFound, err)
	}
}
