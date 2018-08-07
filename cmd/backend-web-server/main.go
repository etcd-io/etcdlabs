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

	"github.com/etcd-io/etcdlabs/backend/web"

	_ "github.com/ugorji/go/codec"
	"go.uber.org/zap"
)

var (
	webPort         int
	recordTesterEps string
)

var lg *zap.SugaredLogger

func init() {
	l, err := zap.NewProduction()
	if err != nil {
		panic(err)
	}
	lg = l.Sugar()
}

func main() {
	flag.IntVar(&webPort, "web-port", 2200, "Specify the web port for backend.")
	flag.Parse()

	lg.Info("starting web server")
	srv, err := web.StartServer(webPort)
	if err != nil {
		panic(err)
	}
	lg.Info("started web server")
	defer srv.Stop()

	sc := make(chan os.Signal, 10)
	signal.Notify(sc, os.Interrupt, os.Kill)
	select {
	case s := <-sc:
		lg.Infof("shutting down server with signal %q", s.String())
	case <-srv.StopNotify():
		lg.Info("shutting down server with stop signal")
	}
}
