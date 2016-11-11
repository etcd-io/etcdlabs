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
	"github.com/spf13/cobra"
)

func init() {
	cobra.EnablePrefixMatching = true
}

func main() {
	if err := rootCommand.Execute(); err != nil {
		fmt.Fprintln(os.Stdout, err)
		os.Exit(1)
	}
}

var metricsName string
var metricsEndpoint string

var dbHost string
var dbPort int
var dbUser string
var dbPassword string

var syncInterval time.Duration

var rootCommand = &cobra.Command{
	Use:        "reporter",
	Short:      "reporter is etcd functional-tester reporter.",
	SuggestFor: []string{"etcd-tester-reportr", "etcdtesterreporter"},
}

func init() {
	rootCommand.PersistentFlags().StringVar(&metricsName, "metrics-name", "", "metrics name")
	rootCommand.PersistentFlags().StringVar(&metricsEndpoint, "metrics-endpoint", "", "metrics endpoint")

	rootCommand.PersistentFlags().StringVar(&dbHost, "db-host", "", "database host")
	rootCommand.PersistentFlags().IntVar(&dbPort, "db-port", 3306, "database port")
	rootCommand.PersistentFlags().StringVar(&dbUser, "db-user", "root", "database user")
	rootCommand.PersistentFlags().StringVar(&dbPassword, "db-password", "", "database password")

	syncCommand.PersistentFlags().DurationVarP(&syncInterval, "sync-interval", "i", time.Duration(0), "interval to run sync")

	rootCommand.AddCommand(pingCommand)
	rootCommand.AddCommand(syncCommand)
}

var pingCommand = &cobra.Command{
	Use:   "ping",
	Short: "ping ping etcd functional-tester and database.",
	RunE:  pingCommandFunc,
}

func pingCommandFunc(cmd *cobra.Command, args []string) error {
	if len(metricsEndpoint) < 3 {
		return fmt.Errorf("got empty metrics endpoint %q", metricsEndpoint)
	}
	if dbHost == "" {
		return fmt.Errorf("got empty db host %q", dbHost)
	}
	if dbPort == 0 {
		return fmt.Errorf("got 0 db port")
	}
	if dbUser == "" {
		return fmt.Errorf("got empty db user %q", dbUser)
	}

	mt := metrics.New(metricsName, metricsEndpoint, dbHost, dbPort, dbUser, dbPassword)
	mt.Ping()
	return nil
}

var syncCommand = &cobra.Command{
	Use:   "sync",
	Short: "sync syncs etcd functional-tester to the database.",
	RunE:  syncCommandFunc,
}

func syncCommandFunc(cmd *cobra.Command, args []string) error {
	if len(metricsEndpoint) < 3 {
		return fmt.Errorf("got empty metrics endpoint %q", metricsEndpoint)
	}
	if dbHost == "" {
		return fmt.Errorf("got empty db host %q", dbHost)
	}
	if dbPort == 0 {
		return fmt.Errorf("got 0 db port")
	}
	if dbUser == "" {
		return fmt.Errorf("got empty db user %q", dbUser)
	}

	mt := metrics.New(metricsName, metricsEndpoint, dbHost, dbPort, dbUser, dbPassword)

	for {
		if err := mt.Sync(); err != nil {
			return err
		}
		if syncInterval < time.Duration(1) {
			fmt.Println("sync done!")
			break
		}
		fmt.Println("sleeping", syncInterval)
		time.Sleep(syncInterval)
	}
	return nil
}
