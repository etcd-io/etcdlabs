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

	"github.com/spf13/cobra"
)

var rootCommand = &cobra.Command{
	Use:        "etcd-tester-reporter",
	Short:      "etcd-tester-reporter is etcd functional-tester reporter.",
	SuggestFor: []string{"etcd-tester-reportr", "etcdtesterreporter"},
}

func init() {
	cobra.EnablePrefixMatching = true
}

var metricsName string
var metricsEndpoint string

var dbHost string
var dbPort int
var dbUser string
var dbPassword string

func init() {
	rootCommand.PersistentFlags().StringVar(&metricsName, "metrics-name", "", "metrics name")
	rootCommand.PersistentFlags().StringVar(&metricsEndpoint, "metrics-endpoint", "", "metrics endpoint")

	rootCommand.PersistentFlags().StringVar(&dbHost, "db-host", "", "database host")
	rootCommand.PersistentFlags().IntVar(&dbPort, "db-port", 3306, "database port")
	rootCommand.PersistentFlags().StringVar(&dbUser, "db-user", "root", "database user")
	rootCommand.PersistentFlags().StringVar(&dbPassword, "db-password", "", "database password")

	rootCommand.AddCommand(pingCommand)
}

func main() {
	if err := rootCommand.Execute(); err != nil {
		fmt.Fprintln(os.Stdout, err)
		os.Exit(1)
	}
}
