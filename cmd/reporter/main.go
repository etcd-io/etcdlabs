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

package main

import (
	"fmt"
	"os"

	"time"

	"github.com/coreos/etcdlabs/pkg/metrics"
	"github.com/coreos/pkg/capnslog"
	"github.com/spf13/cobra"
)

var plog = capnslog.NewPackageLogger("github.com/coreos/etcdlabs", "reporter")

func init() {
	cobra.EnablePrefixMatching = true
}

func main() {
	if err := rootCommand.Execute(); err != nil {
		fmt.Fprintln(os.Stdout, err)
		os.Exit(1)
	}
}

var dbHost string
var dbPort int
var dbUser string
var dbPassword string

var metricsNames []string
var metricsEndpoints []string

var syncInterval time.Duration

var rootCommand = &cobra.Command{
	Use:        "reporter",
	Short:      "reporter is etcd functional-tester reporter.",
	SuggestFor: []string{"etcd-tester-reportr", "etcdtesterreporter"},
}

func init() {
	rootCommand.PersistentFlags().StringVar(&dbHost, "db-host", "", "database host")
	rootCommand.PersistentFlags().IntVar(&dbPort, "db-port", 3306, "database port")
	rootCommand.PersistentFlags().StringVar(&dbUser, "db-user", "root", "database user")
	rootCommand.PersistentFlags().StringVar(&dbPassword, "db-password", "", "database password")

	rootCommand.PersistentFlags().StringSliceVar(&metricsNames, "metrics-names", []string{}, "metrics names (must be same order as endpoints)")
	rootCommand.PersistentFlags().StringSliceVar(&metricsEndpoints, "metrics-endpoints", []string{}, "metrics endpoints (must be same order as names)")

	syncCommand.PersistentFlags().DurationVarP(&syncInterval, "sync-interval", "i", time.Duration(0), "interval to run sync")

	rootCommand.AddCommand(pingCommand)
	rootCommand.AddCommand(syncCommand)
}

var pingCommand = &cobra.Command{
	Use:   "ping",
	Short: "ping ping etcd functional-tester and database.",
	RunE:  pingCommandFunc,
}

func getMetrics() (metrics.Metrics, error) {
	if len(metricsNames) == 0 {
		return nil, fmt.Errorf("got empty metrics names %v", metricsNames)
	}
	if len(metricsEndpoints) == 0 {
		return nil, fmt.Errorf("got empty metrics endpoints %v", metricsEndpoints)
	}
	if len(metricsNames) != len(metricsEndpoints) {
		return nil, fmt.Errorf("got different number of names and endpoints; %v, %v", metricsNames, metricsEndpoints)
	}
	if dbHost == "" {
		return nil, fmt.Errorf("got empty db host %q", dbHost)
	}
	if dbPort == 0 {
		return nil, fmt.Errorf("got 0 db port")
	}
	if dbUser == "" {
		return nil, fmt.Errorf("got empty db user %q", dbUser)
	}

	statuses := make(map[string]*metrics.TesterStatus)
	for i := range metricsNames {
		statuses[metricsNames[i]] = &metrics.TesterStatus{
			Name:            metricsNames[i],
			MetricsEndpoint: metricsEndpoints[i],
		}
	}
	return metrics.New(dbHost, dbPort, dbUser, dbPassword, statuses), nil
}

func pingCommandFunc(cmd *cobra.Command, args []string) error {
	mt, err := getMetrics()
	if err != nil {
		return err
	}
	return mt.Ping()
}

var syncCommand = &cobra.Command{
	Use:   "sync",
	Short: "sync syncs etcd functional-tester to the database.",
	RunE:  syncCommandFunc,
}

func syncCommandFunc(cmd *cobra.Command, args []string) error {
	mt, err := getMetrics()
	if err != nil {
		return err
	}

	for {
		if err := mt.Sync(); err != nil {
			return err
		}

		if syncInterval < time.Duration(1) {
			break
		}

		plog.Println("Sleeping", syncInterval)
		time.Sleep(syncInterval)
	}

	plog.Println("Sync done!")
	return nil
}
