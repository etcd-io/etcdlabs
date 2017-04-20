package cluster

import (
	"github.com/coreos/pkg/capnslog"
	"google.golang.org/grpc/grpclog"
)

var plog = capnslog.NewPackageLogger("github.com/coreos/etcdlabs", "cluster")

func init() {
	capnslog.SetGlobalLogLevel(capnslog.INFO)
	grpclog.SetLogger(plog)
}
