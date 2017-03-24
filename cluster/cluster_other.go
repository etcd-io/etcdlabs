package cluster

import (
	"strings"
	"time"

	"github.com/coreos/etcd/embed"
)

func (clus *Cluster) initialCluster() string {
	inits := make([]string, len(clus.Members))
	for i := 0; i < len(clus.Members); i++ {
		inits[i] = clus.Members[i].cfg.Name + "=" + clus.Members[i].cfg.APUrls[0].String()
	}
	return strings.Join(inits, ",")
}

// InitialCluster returns the 'initial-cluster' string.
func (clus *Cluster) InitialCluster() string {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()
	return clus.initialCluster()
}

// allMemberIDs returns all member IDs.
func (clus *Cluster) allMemberIDs() map[uint64]bool {
	ms := make(map[uint64]bool, len(clus.Members))
	for _, m := range clus.Members {
		ms[uint64(m.srv.Server.ID())] = true
	}
	return ms
}

// SetClientDialTimeout sets the client dial timeout.
func (clus *Cluster) SetClientDialTimeout(d time.Duration) {
	clus.clientDialTimeout = d
}

// StoppedStartedAt returns the node's last stop and (re)start action time.
func (clus *Cluster) StoppedStartedAt(i int) time.Time {
	return clus.Members[i].stoppedStartedAt
}

// Config returns the configuration of the server.
func (clus *Cluster) Config(i int) embed.Config {
	return *clus.Members[i].cfg
}

// AllConfigs returns all configurations.
func (clus *Cluster) AllConfigs() []embed.Config {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	cs := make([]embed.Config, clus.size)
	for i := range clus.Members {
		cs[i] = *clus.Members[i].cfg
	}
	return cs
}

// Endpoints returns the endpoints of the node.
func (clus *Cluster) Endpoints(i int, scheme bool) []string {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	var eps []string
	for _, ep := range clus.Members[i].cfg.LCUrls {
		if scheme {
			eps = append(eps, ep.String())
		} else {
			eps = append(eps, ep.Host)
		}
	}
	return eps
}

// AllEndpoints returns all endpoints of clients.
func (clus *Cluster) AllEndpoints(scheme bool) []string {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	eps := make([]string, clus.size)
	for i := 0; i < clus.size; i++ {
		if scheme {
			eps[i] = clus.Members[i].cfg.LCUrls[0].String()
		} else {
			eps[i] = clus.Members[i].cfg.LCUrls[0].Host
		}
	}
	return eps
}

// IsStopped returns true if the node has stopped.
func (clus *Cluster) IsStopped(i int) (stopped bool) {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	clus.Members[i].statusLock.Lock()
	stopped = clus.Members[i].status.State == StoppedMemberStatus
	clus.Members[i].statusLock.Unlock()
	return stopped
}

// Size returns the size of cluster.
func (clus *Cluster) Size() int {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	return len(clus.Members)
}

// Quorum returns the size of quorum.
func (clus *Cluster) Quorum() int {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	return len(clus.Members)/2 + 1
}

// ActiveNodeN returns the number of Members that are running.
func (clus *Cluster) ActiveNodeN() (cnt int) {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	for i := range clus.Members {
		clus.Members[i].statusLock.Lock()
		if clus.Members[i].status.State != StoppedMemberStatus {
			cnt++
		}
		clus.Members[i].statusLock.Unlock()
	}
	return
}

// MemberStatus returns the node status.
func (clus *Cluster) MemberStatus(i int) MemberStatus {
	return clus.Members[i].status
}

// AllMemberStatus returns all node status.
func (clus *Cluster) AllMemberStatus() []MemberStatus {
	clus.mmu.RLock()
	defer clus.mmu.RUnlock()

	st := make([]MemberStatus, clus.size)
	for i := range clus.Members {
		st[i] = clus.Members[i].status
	}
	return st
}

// FindIndex returns the node index by client URL. It returns -1 if none.
func (clus *Cluster) FindIndex(ep string) int {
	idx, ok := clus.clientHostToIndex[getHost(ep)]
	if !ok {
		return -1
	}
	return idx
}
