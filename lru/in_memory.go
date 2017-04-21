package lru

import (
	"container/list"
	"sync"
)

// NewInMemory returns a new in-memory LRU cache.
func NewInMemory(size int) Cache {
	return &inMemory{
		cap:     size,
		buckets: make(map[string]*bucket),
	}
}

type pair struct {
	key   interface{}
	value interface{}
}

type bucket struct {
	kvs  *list.List
	k2it map[interface{}]*list.Element
}

func newBucket(size int) *bucket {
	return &bucket{
		kvs:  list.New(),
		k2it: make(map[interface{}]*list.Element, size),
	}
}

// inMemory implements in-memory LRU cache.
type inMemory struct {
	mu      sync.Mutex
	cap     int
	buckets map[string]*bucket
}

func (c *inMemory) Put(namespace string, key, value interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	b, ok := c.buckets[namespace]
	if !ok {
		b = newBucket(c.cap)
		c.buckets[namespace] = b
	}
	if b.k2it == nil {
		return ErrStopped
	}

	if v, ok := b.k2it[key]; ok {
		b.kvs.MoveToFront(v)
		b.k2it[key].Value.(*pair).value = value
		return nil
	}

	if c.cap > 0 && len(b.k2it) == c.cap {
		oldest := b.kvs.Back()
		oldestkey := oldest.Value.(*pair).key
		b.kvs.Remove(oldest)
		delete(b.k2it, oldestkey)
	}

	b.kvs.PushFront(&pair{key, value})
	b.k2it[key] = b.kvs.Front()
	return nil
}

func (c *inMemory) Get(namespace string, key interface{}) (interface{}, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	b, ok := c.buckets[namespace]
	if !ok {
		return nil, ErrNamespaceNotFound
	}

	v, ok := b.k2it[key]
	if !ok {
		return nil, ErrKeyNotFound
	}

	b.kvs.MoveToFront(v)
	return v.Value.(*pair).value, nil
}
