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
	"github.com/coreos/etcd/pkg/transport"
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
		eps[j] = ups[j].Host
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

// Config defines etcd local cluster Configuration.
type Config struct {
	Size     int
	RootDir  string
	RootPort int

	ClientTLSInfo transport.TLSInfo
	ClientAutoTLS bool
	PeerTLSInfo   transport.TLSInfo
	PeerAutoTLS   bool
}

// Start starts embedded etcd cluster.
func Start(ccfg Config) (*Cluster, error) {
	plog.Printf("starting %d nodes (root directory %q, root port :%d)", ccfg.Size, ccfg.RootDir, ccfg.RootPort)

	c := &Cluster{
		rootDir: ccfg.RootDir,
		cfgs:    make([]*embed.Config, ccfg.Size),
		embeds:  make([]*embed.Etcd, ccfg.Size),
	}

	if !existFileOrDir(ccfg.RootDir) {
		if err := mkdirAll(ccfg.RootDir); err != nil {
			return nil, err
		}
	}

	if !ccfg.ClientTLSInfo.Empty() && ccfg.ClientAutoTLS {
		return nil, fmt.Errorf("choose either auto TLS or manual client TLS")
	}
	clientScheme := "https"
	if ccfg.ClientTLSInfo.Empty() && !ccfg.ClientAutoTLS {
		clientScheme = "http"
	}

	if !ccfg.PeerTLSInfo.Empty() && ccfg.PeerAutoTLS {
		return nil, fmt.Errorf("choose either auto TLS or manual peer TLS")
	}
	peerScheme := "https"
	if ccfg.PeerTLSInfo.Empty() && !ccfg.PeerAutoTLS {
		peerScheme = "http"
	}

	startPort := ccfg.RootPort
	for i := 0; i < ccfg.Size; i++ {
		cfg := embed.NewConfig()

		cfg.Name = fmt.Sprintf("name%d", i)
		cfg.Dir = filepath.Join(ccfg.RootDir, cfg.Name+".etcd")
		cfg.WalDir = filepath.Join(cfg.Dir, "wal")

		clientURL := url.URL{
			Scheme: clientScheme,
			Host:   fmt.Sprintf("localhost:%d", startPort),
		}
		cfg.LCUrls = []url.URL{clientURL}
		cfg.ACUrls = []url.URL{clientURL}

		peerURL := url.URL{
			Scheme: peerScheme,
			Host:   fmt.Sprintf("localhost:%d", startPort+1),
		}
		cfg.LPUrls = []url.URL{peerURL}
		cfg.APUrls = []url.URL{peerURL}

		cfg.ClientAutoTLS = ccfg.ClientAutoTLS
		cfg.ClientTLSInfo = ccfg.ClientTLSInfo
		cfg.PeerAutoTLS = ccfg.PeerAutoTLS
		cfg.PeerTLSInfo = ccfg.PeerTLSInfo

		c.cfgs[i] = cfg

		plog.Printf("starting %q (client %s, peer %s)", cfg.Name, cfg.LCUrls[0].String(), cfg.LPUrls[0].String())

		startPort += 2
	}

	var initialClusters []string
	for i := 0; i < ccfg.Size; i++ {
		initialClusters = append(initialClusters, c.cfgs[i].Name+"="+c.cfgs[i].APUrls[0].String())
	}
	initialCluster := strings.Join(initialClusters, ",")

	for i := 0; i < ccfg.Size; i++ {
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

	plog.Printf("%d nodes are ready", ccfg.Size)
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
