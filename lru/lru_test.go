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
	if v, err := c.Get("foo"); err != nil || fmt.Sprint(v) != "bar" {
		t.Fatal(err)
	}
}
