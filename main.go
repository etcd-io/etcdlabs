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
	"fmt"
	"os"
	"os/signal"

	"github.com/coreos/etcdlabs/backend"
	"github.com/coreos/pkg/capnslog"
	"github.com/spf13/cobra"
)

var plog = capnslog.NewPackageLogger("github.com/coreos/etcdlabs", "etcdlabs")

func init() {
	capnslog.SetGlobalLogLevel(capnslog.INFO)
}

func init() {
	cobra.EnablePrefixMatching = true
}

func main() {
	if err := rootCommand.Execute(); err != nil {
		fmt.Fprintln(os.Stdout, err)
		os.Exit(1)
	}
}

var webPort int

var rootCommand = &cobra.Command{
	Use:        "etcdlabs",
	Short:      "etcdlabs runs etcdlabs.",
	SuggestFor: []string{"etcdlab", "etcdlabss"},
}

func init() {
	rootCommand.PersistentFlags().IntVar(&webPort, "web-port", 2200, "web server port")

	rootCommand.AddCommand(webCommand)
}

var webCommand = &cobra.Command{
	Use:   "web",
	Short: "web runs etcdlabs backend web server.",
	RunE:  webCommandFunc,
}

func webCommandFunc(cmd *cobra.Command, args []string) error {
	// TODO: get metrics
	srv, err := backend.StartServer(webPort, backend.MinFetchMetricsInterval)
	if err != nil {
		return err
	}
	defer srv.Stop()

	sc := make(chan os.Signal, 10)
	signal.Notify(sc, os.Interrupt, os.Kill)
	select {
	case s := <-sc:
		plog.Infof("shutting down server with signal %q", s.String())
	case <-srv.StopNotify():
		plog.Info("shutting down server with stop signal")
	}
	return nil
}
