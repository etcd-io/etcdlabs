package cluster

import "github.com/coreos/pkg/capnslog"

var testLogLevel = capnslog.INFO

func init() {
	capnslog.SetGlobalLogLevel(testLogLevel)
}
