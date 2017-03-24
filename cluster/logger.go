package cluster

import (
	"github.com/coreos/pkg/capnslog"
	"google.golang.org/grpc/grpclog"
)

var plog = capnslog.NewPackageLogger("github.com/gyuho/etcd-by-example", "cluster")

func init() {
	capnslog.SetGlobalLogLevel(capnslog.INFO)
	grpclog.SetLogger(plog)
}
