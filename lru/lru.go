package lru

import (
	"container/list"
	"sync"
)

// NewInMemory returns a new in-memory LRU cache.
func NewInMemory(size int) Cache {
	return &cache{
		cap:  size,
		kvs:  list.New(),
		k2it: make(map[interface{}]*list.Element, size),
	}
}

type pair struct {
	key   interface{}
	value interface{}
}

// cache implements in-memory LRU cache.
type cache struct {
	mu   sync.Mutex
	cap  int
	kvs  *list.List
	k2it map[interface{}]*list.Element
}

func (c *cache) Put(key, value interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.k2it == nil {
		return ErrStopped
	}

	if v, ok := c.k2it[key]; ok {
		c.kvs.MoveToFront(v)
		c.k2it[key].Value.(*pair).value = value
		return nil
	}

	if c.cap > 0 && len(c.k2it) == c.cap {
		oldest := c.kvs.Back()
		oldestkey := oldest.Value.(*pair).key
		c.kvs.Remove(oldest)
		delete(c.k2it, oldestkey)
	}

	c.kvs.PushFront(&pair{key, value})
	c.k2it[key] = c.kvs.Front()
	return nil
}

func (c *cache) Get(key interface{}) (interface{}, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	v, ok := c.k2it[key]
	if !ok {
		return nil, ErrKeyNotFound
	}

	c.kvs.MoveToFront(v)
	return v.Value.(*pair).value, nil
}
