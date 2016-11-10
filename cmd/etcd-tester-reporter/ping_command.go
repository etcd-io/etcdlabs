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

	"github.com/coreos/etcdlabs/pkg/metrics"
	"github.com/spf13/cobra"
)

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
	if dbPassword == "" {
		return fmt.Errorf("got empty db password %q", dbPassword)
	}

	mt := metrics.New(metricsName, metricsEndpoint, dbHost, dbPort, dbUser, dbPassword)
	mt.Ping()
	return nil
}
