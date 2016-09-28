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
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/coreos/etcd/embed"
	"github.com/coreos/pkg/capnslog"
)

var plog = capnslog.NewPackageLogger("github.com/coreos/etcdlabs", "cluster")

// Cluster contains all embedded etcd nodes in the same cluster.
// Configuration is meant to be auto-generated.
type Cluster struct {
	mu      sync.Mutex
	rootDir string
	cfgs    []*embed.Config
	embeds  []*embed.Etcd
}

// GetConfig returns embed.Config of the index.
func (c *Cluster) GetConfig(i int) *embed.Config {
	return c.cfgs[i]
}

// GetEmbed returns embed.Etcd of the index.
func (c *Cluster) GetEmbed(i int) *embed.Etcd {
	return c.embeds[i]
}

// GetClientEndpoints returns the client endpoints of the index.
func (c *Cluster) GetClientEndpoints(i int) []string {
	ups := c.cfgs[i].LCUrls
	eps := make([]string, len(ups))
	for j := range ups {
		eps[i] = ups[j].String()
	}
	return eps
}

// GetAllClientEndpoints returns all endpoints of clients.
func (c *Cluster) GetAllClientEndpoints() []string {
	epm := make(map[string]struct{})
	for i := 0; i < len(c.cfgs); i++ {
		for _, ep := range c.GetClientEndpoints(i) {
			epm[ep] = struct{}{}
		}
	}
	eps := make([]string, 0, len(epm))
	for ep := range epm {
		eps = append(eps, ep)
	}
	sort.Strings(eps)
	return eps
}

// Start starts embedded etcd cluster.
func Start(size int, rootDir string, rootPort int) (*Cluster, error) {
	plog.Printf("starting %d nodes (root directory %q, root port :%d)", size, rootDir, rootPort)

	c := &Cluster{
		rootDir: rootDir,
		cfgs:    make([]*embed.Config, size),
		embeds:  make([]*embed.Etcd, size),
	}

	if !existFileOrDir(rootDir) {
		if err := mkdirAll(rootDir); err != nil {
			return nil, err
		}
	}

	startPort := rootPort
	for i := 0; i < size; i++ {
		cfg := embed.NewConfig()

		cfg.Name = fmt.Sprintf("name%d", i)
		cfg.Dir = filepath.Join(rootDir, cfg.Name+".etcd")
		cfg.WalDir = filepath.Join(cfg.Dir, "wal")

		// TODO: use TLS + https
		clientURL := url.URL{
			Scheme: "http",
			Host:   fmt.Sprintf("localhost:%d", startPort),
		}
		peerURL := url.URL{
			Scheme: "http",
			Host:   fmt.Sprintf("localhost:%d", startPort+1),
		}

		cfg.LCUrls = []url.URL{clientURL}
		cfg.ACUrls = []url.URL{clientURL}

		cfg.LPUrls = []url.URL{peerURL}
		cfg.APUrls = []url.URL{peerURL}

		c.cfgs[i] = cfg

		plog.Printf("starting %q (client %s, peer %s)", cfg.Name, cfg.LCUrls[0].String(), cfg.LPUrls[0].String())

		startPort += 2
	}

	var initialClusters []string
	for i := 0; i < size; i++ {
		initialClusters = append(initialClusters, c.cfgs[i].Name+"="+c.cfgs[i].APUrls[0].String())
	}
	initialCluster := strings.Join(initialClusters, ",")

	for i := 0; i < size; i++ {
		c.cfgs[i].InitialCluster = initialCluster

		var err error
		c.embeds[i], err = embed.StartEtcd(c.cfgs[i])
		if err != nil {
			return nil, err
		}
	}

	var wg sync.WaitGroup
	wg.Add(len(c.embeds))
	for i := range c.embeds {
		go func(e *embed.Etcd) {
			defer wg.Done()
			<-e.Server.ReadyNotify()
		}(c.embeds[i])
	}
	wg.Wait()

	plog.Printf("%d nodes are ready", size)
	return c, nil
}

// Shutdown stops all nodes in the cluster and deletes all the data directories.
func (c *Cluster) Shutdown() {
	c.mu.Lock()
	defer c.mu.Unlock()

	var wg sync.WaitGroup
	wg.Add(len(c.embeds))
	for i := range c.embeds {
		go func(e *embed.Etcd) {
			defer wg.Done()
			e.Close()
			<-e.Err()
		}(c.embeds[i])
	}
	wg.Wait()

	os.RemoveAll(c.rootDir)
}
