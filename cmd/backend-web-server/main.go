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

// etcdlabs runs backend with embedded etcd servers.
package main

import (
	"flag"
	"os"
	"os/signal"
	"strings"

	"github.com/coreos/etcdlabs/backend/web"
	"github.com/coreos/etcdlabs/pkg/gcp"

	"github.com/golang/glog"
)

var (
	webPort         int
	recordTesterEps string
)

func main() {
	flag.IntVar(&webPort, "web-port", 2200, "Specify the web port for backend.")
	flag.StringVar(&recordTesterEps, "record-tester-endpoints", "http://10.240.0.10:9028,http://10.240.0.17:9028", "Specify etcd tester endpoints.")
	flag.Parse()

	// assume the instance is created with gcp-key metadata
	key, err := gcp.GetComputeMetadata("instance/attributes/gcp-key")
	if err != nil {
		glog.Warning(err)
	} else {
		glog.Infof("found GCS key %s...", string(key)[:5])
	}

	glog.Info("starting web server")
	srv, err := web.StartServer(webPort, key, strings.Split(recordTesterEps, ","))
	if err != nil {
		glog.Fatal(err)
	}
	glog.Info("started web server")
	defer srv.Stop()

	sc := make(chan os.Signal, 10)
	signal.Notify(sc, os.Interrupt, os.Kill)
	select {
	case s := <-sc:
		glog.Infof("shutting down server with signal %q", s.String())
	case <-srv.StopNotify():
		glog.Info("shutting down server with stop signal")
	}
}
