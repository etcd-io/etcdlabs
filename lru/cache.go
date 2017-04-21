package lru

import "fmt"

var (
	// ErrStopped is returned when the cache is stopped or not initialized.
	ErrStopped = fmt.Errorf("lru: stopped or not initialized")

	// ErrNamespaceNotFound is returned when the namespace is not found.
	ErrNamespaceNotFound = fmt.Errorf("lru: namespace not found")

	// ErrKeyNotFound is returned when the key is not found.
	ErrKeyNotFound = fmt.Errorf("lru: key not found")
)

// Cache defines LRU cache store.
type Cache interface {
	// Put writes a key-value pair.
	Put(namespace string, key, value interface{}) error

	// Get returns the value, or 'ErrKeyNotFound'.
	Get(namespace string, key interface{}) (interface{}, error)
}
