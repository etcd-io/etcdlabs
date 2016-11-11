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
	"github.com/coreos/etcdlabs/pkg/metrics"
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

var dbHost string
var dbPort int
var dbUser string
var dbPassword string

var metricsNames []string
var metricsEndpoints []string

var rootCommand = &cobra.Command{
	Use:        "etcdlabs",
	Short:      "etcdlabs runs etcdlabs.",
	SuggestFor: []string{"etcdlab", "etcdlabss"},
}

func init() {
	webCommand.PersistentFlags().IntVar(&webPort, "web-port", 2200, "web server port")

	rootCommand.PersistentFlags().StringVar(&dbHost, "db-host", "", "database host")
	rootCommand.PersistentFlags().IntVar(&dbPort, "db-port", 3306, "database port")
	rootCommand.PersistentFlags().StringVar(&dbUser, "db-user", "root", "database user")
	rootCommand.PersistentFlags().StringVar(&dbPassword, "db-password", "", "database password")

	webCommand.PersistentFlags().StringSliceVar(&metricsNames, "metrics-names", []string{}, "metrics names (must be same order as endpoints)")
	webCommand.PersistentFlags().StringSliceVar(&metricsEndpoints, "metrics-endpoints", []string{}, "metrics endpoints (must be same order as names)")

	rootCommand.AddCommand(webCommand)
}

var webCommand = &cobra.Command{
	Use:   "web",
	Short: "web runs etcdlabs backend web server.",
	RunE:  webCommandFunc,
}

func webCommandFunc(cmd *cobra.Command, args []string) error {
	if len(metricsNames) == 0 {
		return nil, fmt.Errorf("got empty metrics names %v", metricsNames)
	}
	if len(metricsEndpoints) == 0 {
		return nil, fmt.Errorf("got empty metrics endpoints %v", metricsEndpoints)
	}
	if len(metricsNames) != len(metricsEndpoints) {
		return nil, fmt.Errorf("got different number of names and endpoints; %v, %v", metricsNames, metricsEndpoints)
	}

	statuses := make(map[string]*metrics.TesterStatus)
	for i := range metricsNames {
		statuses[metricsNames[i]] = &metrics.TesterStatus{
			Name:            metricsNames[i],
			MetricsEndpoint: metricsEndpoints[i],
		}
	}
	mt := metrics.New(dbHost, dbPort, dbUser, dbPassword, statuses)

	srv, err := backend.StartServer(webPort, mt)
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
