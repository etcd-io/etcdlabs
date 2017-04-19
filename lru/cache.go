package lru

import "fmt"

var (
	// ErrStopped is returned when the cache is stopped or not initialized.
	ErrStopped = fmt.Errorf("lru: stopped or not initialized")

	// ErrKeyNotFound is returned when the key is not found.
	ErrKeyNotFound = fmt.Errorf("lru: key not found")
)

// Cache defines LRU cache store.
type Cache interface {
	// Put writes a key-value pair.
	Put(key, value interface{}) error

	// Get returns the value, or 'ErrKeyNotFound'.
	Get(key interface{}) (interface{}, error)
}

// CacheStorage defines LRU cache, backed by persistent storage.
type CacheStorage interface {
	Connect() error
	Stop() error

	Cache
}
