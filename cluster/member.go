package cluster

import (
	"context"
	"crypto/tls"
	"fmt"
	"sync"
	"time"

	"github.com/coreos/etcdlabs/cluster/clusterpb"

	"github.com/coreos/etcd/clientv3"
	"github.com/coreos/etcd/embed"
	"github.com/coreos/etcd/etcdserver/api/v3client"
	pb "github.com/coreos/etcd/etcdserver/etcdserverpb"
	"github.com/coreos/etcd/pkg/types"
	humanize "github.com/dustin/go-humanize"
	"github.com/golang/glog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// Member contains *embed.Etcd and its state.
type Member struct {
	clus *Cluster
	cfg  *embed.Config
	srv  *embed.Etcd

	stoppedStartedAt time.Time

	statusLock sync.RWMutex
	status     clusterpb.MemberStatus
}

// Start starts the member.
func (m *Member) Start() error {
	srv, err := embed.StartEtcd(m.cfg)
	if err != nil {
		return err
	}
	m.srv = srv

	// copy and overwrite with internal configuration
	// in case it was configured with auto TLS
	nc := m.srv.Config()
	m.cfg = &nc

	var rerr error
	select {
	case <-m.srv.Server.ReadyNotify():
	case rerr = <-m.srv.Err():
	case <-m.srv.Server.StopNotify():
		rerr = fmt.Errorf("received from etcdserver.Server.StopNotify")
	}
	if rerr != nil {
		return rerr
	}

	m.stoppedStartedAt = time.Now()

	m.statusLock.Lock()
	m.status.State = clusterpb.FollowerMemberStatus
	m.status.StateTxt = fmt.Sprintf("%s just started (%s)", m.status.Name, humanize.Time(m.stoppedStartedAt))
	m.status.IsLeader = false
	m.statusLock.Unlock()

	glog.Infof("started %s (client %s, peer %s)", m.cfg.Name, m.cfg.LCUrls[0].String(), m.cfg.LPUrls[0].String())
	return nil
}

// Restart restarts the member.
func (m *Member) Restart() error {
	glog.Infof("restarting %q(%s)", m.cfg.Name, m.srv.Server.ID().String())

	m.statusLock.RLock()
	if m.status.State != clusterpb.StoppedMemberStatus {
		plog.Warningf("%s is already started", m.cfg.Name)
		m.statusLock.RUnlock()
		return nil
	}
	m.statusLock.RUnlock()

	m.cfg.ClusterState = embed.ClusterStateFlagExisting

	// start server
	srv, err := embed.StartEtcd(m.cfg)
	if err != nil {
		return err
	}
	m.srv = srv

	nc := m.srv.Config()
	m.cfg = &nc

	// this blocks when quorum is lost
	// <-m.srv.Server.ReadyNotify()

	m.stoppedStartedAt = time.Now()

	m.statusLock.Lock()
	m.status.IsLeader = false
	m.status.State = clusterpb.FollowerMemberStatus
	m.status.StateTxt = fmt.Sprintf("%s just restarted (%s)", m.status.Name, humanize.Time(m.stoppedStartedAt))
	m.statusLock.Unlock()

	glog.Infof("restarted %q(%s)", m.cfg.Name, m.srv.Server.ID().String())
	return nil
}

// Stop stops the member.
func (m *Member) Stop() {
	glog.Infof("stopping %q(%s)", m.cfg.Name, m.srv.Server.ID().String())

	m.statusLock.RLock()
	if m.status.State == clusterpb.StoppedMemberStatus {
		plog.Warningf("%s is already stopped", m.cfg.Name)
		m.statusLock.RUnlock()
		return
	}
	m.statusLock.RUnlock()

	m.stoppedStartedAt = time.Now()

	m.statusLock.Lock()
	m.status.IsLeader = false
	m.status.State = clusterpb.StoppedMemberStatus
	m.status.StateTxt = fmt.Sprintf("%s just stopped (%s)", m.status.Name, humanize.Time(m.stoppedStartedAt))
	m.status.DBSize = 0
	m.status.DBSizeTxt = ""
	m.status.Hash = 0
	m.statusLock.Unlock()

	// TODO: stop with/without leadership transfer?
	// m.srv.Server.HardStop()

	// stops embedded server to trigger
	// gRPC server graceful shutdown
	m.srv.Close()

	var cerr error
	select {
	case cerr = <-m.srv.Err():
	case <-m.srv.Server.StopNotify():
		cerr = fmt.Errorf("received from EtcdServer.StopNotify")
	}
	if cerr != nil {
		plog.Warningf("shutdown with %q", cerr.Error())
	} else {
		glog.Infof("shutdown with no error")
	}
	glog.Infof("stopped %q(%s)", m.cfg.Name, m.srv.Server.ID().String())
}

// WaitForLeader waits for the member to find a leader.
func (m *Member) WaitForLeader() error {
	m.statusLock.Lock()
	stopped := m.status.State == clusterpb.StoppedMemberStatus
	m.statusLock.Unlock()
	if stopped {
		return nil
	}

	possibleLead := m.clus.allMemberIDs()

	cli, _, err := m.Client(false)
	if err != nil {
		return err
	}
	defer cli.Close()

	for {
		// ensure leader is up via linearizable get
		ctx, cancel := context.WithTimeout(m.clus.rootCtx, 3*time.Second)
		_, err = cli.Get(ctx, "0")
		cancel()
		if err == nil {
			break
		}
		plog.Warning(err)
	}

	for {
		var lead uint64
		for lead == 0 || !possibleLead[lead] {
			lead = 0
			select {
			case <-m.srv.Server.StopNotify():
				continue
			default:
			}
			lead = m.srv.Server.Lead()
			time.Sleep(time.Second)
		}

		ctx, cancel := context.WithTimeout(m.clus.rootCtx, 3*time.Second)
		resp, err := cli.Status(ctx, m.cfg.LCUrls[0].Host)
		cancel()
		if err != nil {
			plog.Warning(err)
			time.Sleep(time.Second)
			continue
		}

		m.status.ID = types.ID(resp.Header.MemberId).String()

		if resp.Leader == uint64(0) {
			glog.Infof("%s %s has no leader yet", m.cfg.Name, types.ID(resp.Header.MemberId))
			m.status.IsLeader = false
			m.status.State = clusterpb.FollowerMemberStatus
			time.Sleep(time.Second)
			continue
		}

		glog.Infof("%s %s has leader %s", m.cfg.Name, types.ID(resp.Header.MemberId), types.ID(resp.Leader))
		m.status.IsLeader = resp.Leader == resp.Header.MemberId
		if m.status.IsLeader {
			m.status.State = clusterpb.LeaderMemberStatus
		} else {
			m.status.State = clusterpb.FollowerMemberStatus
		}

		if lead == resp.Leader {
			break
		}
	}
	return nil
}

// Client creates a client from a member.
// If 'eps' is not empty, it overwrites clientv3.Config.Endpoints.
// If 'embedded' is true, it ignores 'scheme' and 'eps' arguments,
// since it directly connects to a single embedded server.
func (m *Member) Client(scheme bool, eps ...string) (cli *clientv3.Client, tlsCfg *tls.Config, err error) {
	if m.clus.embeddedClient {
		cli = v3client.New(m.srv.Server)
		if !m.clus.ccfg.ClientTLSInfo.Empty() || m.clus.ccfg.ClientAutoTLS {
			if tlsCfg == nil {
				tlsCfg, err = m.cfg.ClientTLSInfo.ClientConfig()
			}
		}
		return cli, tlsCfg, err
	}

	ep := m.cfg.LCUrls[0].String()
	if !scheme {
		ep = m.cfg.LCUrls[0].Host
	}
	ccfg := clientv3.Config{
		Endpoints:   []string{ep},
		DialTimeout: m.clus.clientDialTimeout,
	}
	if len(eps) != 0 {
		ccfg.Endpoints = eps
	}
	if !m.cfg.ClientTLSInfo.Empty() {
		tlsCfg, err = m.cfg.ClientTLSInfo.ClientConfig()
		if err != nil {
			return cli, tlsCfg, err
		}
		ccfg.TLS = tlsCfg
	}
	cli, err = clientv3.New(ccfg)
	return cli, tlsCfg, err
}

// FetchMemberStatus fetches member status (make sure to close the client outside of this funciton).
func (m *Member) FetchMemberStatus() error {
	cli, tlsCfg, err := m.Client(false)
	if err != nil {
		return err
	}
	defer cli.Close()

	now := time.Now()

	ctx, cancel := context.WithTimeout(m.clus.rootCtx, time.Second)
	resp, err := cli.Status(ctx, m.cfg.LCUrls[0].String())
	cancel()
	if err != nil {
		m.statusLock.Lock()
		m.status.State = clusterpb.StoppedMemberStatus
		m.status.StateTxt = fmt.Sprintf("%s is not reachable (%s - %v)", m.status.Name, humanize.Time(now), err)
		m.status.IsLeader = false
		m.status.DBSize = 0
		m.status.DBSizeTxt = ""
		m.status.Hash = 0
		m.statusLock.Unlock()
		return err
	}

	isLeader, state := false, clusterpb.FollowerMemberStatus
	if resp.Header.MemberId == resp.Leader {
		isLeader, state = true, clusterpb.LeaderMemberStatus
	}
	status := clusterpb.MemberStatus{
		Name:      m.cfg.Name,
		ID:        types.ID(resp.Header.MemberId).String(),
		Endpoint:  m.cfg.LCUrls[0].String(),
		IsLeader:  isLeader,
		State:     state,
		StateTxt:  fmt.Sprintf("%s has been healthy (since %s)", m.status.Name, humanize.Time(m.stoppedStartedAt)),
		DBSize:    uint64(resp.DbSize),
		DBSizeTxt: humanize.Bytes(uint64(resp.DbSize)),
	}

	now = time.Now()
	var dopts = []grpc.DialOption{grpc.WithTimeout(time.Second)}
	if tlsCfg != nil {
		dopts = append(dopts, grpc.WithTransportCredentials(credentials.NewTLS(tlsCfg)))
	} else {
		dopts = append(dopts, grpc.WithInsecure())
	}
	conn, err := grpc.Dial(m.cfg.LCUrls[0].Host, dopts...)
	if err != nil {
		m.statusLock.Lock()
		m.status.State = clusterpb.StoppedMemberStatus
		m.status.StateTxt = fmt.Sprintf("%s is not reachable (%s - %v)", m.status.Name, humanize.Time(now), err)
		m.status.IsLeader = false
		m.status.DBSize = 0
		m.status.DBSizeTxt = ""
		m.status.Hash = 0
		m.statusLock.Unlock()
		return err
	}
	defer conn.Close()

	now = time.Now()
	mc := pb.NewMaintenanceClient(conn)

	ctx, cancel = context.WithTimeout(m.clus.rootCtx, time.Second)
	var hresp *pb.HashResponse
	hresp, err = mc.Hash(ctx, &pb.HashRequest{}, grpc.FailFast(false))
	cancel()
	if err != nil {
		m.statusLock.Lock()
		m.status.State = clusterpb.StoppedMemberStatus
		m.status.StateTxt = fmt.Sprintf("%s was not reachable while getting hash (%s - %v)", m.status.Name, humanize.Time(now), err)
		m.status.IsLeader = false
		m.status.DBSize = 0
		m.status.DBSizeTxt = ""
		m.status.Hash = 0
		m.statusLock.Unlock()
		return err
	}
	status.Hash = hresp.Hash

	m.statusLock.Lock()
	m.status = status
	m.statusLock.Unlock()
	return nil
}
