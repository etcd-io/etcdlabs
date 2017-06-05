// Copyright 2017 CoreOS, Inc.
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

package record

import (
	"bufio"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/coreos/etcdlabs/pkg/record/recordpb"

	"github.com/coreos/etcd/tools/functional-tester/etcd-agent/client"
)

func max(n1, n2 int) int {
	if n1 > n2 {
		return n1
	}
	return n2
}

// SyncFromTester updates record data by fetching etcd-tester.
func SyncFromTester(prev *recordpb.Record) error {
	for i, d := range prev.TestData {
		s, err := fetchStatus(d.GetEndpoint() + "/status")
		if err != nil {
			return err
		}
		if s.Cluster.AgentStatuses != nil {
			d.ClusterSize = uint32(len(s.Cluster.AgentStatuses))
		}
		d.Started = s.Since.String()

		prevCurrent := d.GetCurrent()
		d.Current = uint64(len(s.Failures)*s.Round + max(0, s.Case))
		delta := d.Current - prevCurrent
		if delta <= 0 { // tester restarted or case just got reset
			delta = d.Current
		}
		prev.Total += delta

		fss := make([]string, 0, len(s.Failures))
		for _, fs := range s.Failures {
			fss = append(fss, recordpb.TrimFailpoint(fs))
		}
		d.FailureCases = fss

		var rm map[string]int64
		rm, err = fetchFailedCases(d.GetEndpoint() + "/metrics")
		if err != nil {
			return err
		}
		d.CurrentFailed = uint64(len(rm))
		prev.TestData[i] = d
	}
	return nil
}

// Status is copied from github.com/coreos/etcd/tools/functional-tester/etcd-tester/status.go.
type Status struct {
	Since      time.Time
	Failures   []string
	RoundLimit int

	Cluster ClusterStatus

	Round int
	Case  int
}

// ClusterStatus is copied from github.com/coreos/etcd/tools/functional-tester/etcd-tester/cluster.go.
type ClusterStatus struct {
	AgentStatuses map[string]client.Status
}

// fetchStatus fetches etcd-tester record from its '/status' handler.
func fetchStatus(ep string) (Status, error) {
	resp, err := http.Get(ep)
	if err != nil {
		return Status{}, err
	}
	defer func() {
		io.Copy(ioutil.Discard, resp.Body)
		resp.Body.Close()
	}()

	var st Status
	err = json.NewDecoder(resp.Body).Decode(&st)
	return st, err
}

// fetchFailedCases fetches etcd-tester record from its '/metrics' handler.
// etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSave panic all"} 139
func fetchFailedCases(ep string) (map[string]int64, error) {
	resp, err := http.Get(ep)
	if err != nil {
		return nil, err
	}
	defer func() {
		io.Copy(ioutil.Discard, resp.Body)
		resp.Body.Close()
	}()

	rd := bufio.NewReader(resp.Body)
	rm := make(map[string]int64)
	for {
		line, err := rd.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "etcd_funcational_tester_case_failed_total") {
			continue
		}
		cut := strings.LastIndex(line, " ")
		s1 := strings.Replace(line[:cut], `etcd_funcational_tester_case_failed_total{desc="`, "", 1)
		s1 = strings.TrimSpace(strings.Replace(s1, `"}`, "", 1))
		s2 := line[cut+1:]
		num, err := strconv.ParseInt(s2, 10, 64)
		if err != nil {
			return nil, err
		}
		rm[s1] = num
	}
	return rm, nil
}
