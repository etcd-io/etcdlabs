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
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/coreos/etcdlabs/pkg/record/recordpb"

	"github.com/coreos/etcd/tools/functional-tester/etcd-agent/client"
	"github.com/golang/protobuf/proto"
)

func TestRecord(t *testing.T) {
	rec1 := &recordpb.Record{
		Total: 1000,
		TestData: []*recordpb.Data{
			{
				Endpoint:      "http://10.240.0.17:9028",
				Started:       "",
				Current:       100,
				CurrentFailed: 10,
			},
		},
	}

	bts, err := proto.Marshal(rec1)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(string(bts))

	rec2 := &recordpb.Record{}
	if err = proto.Unmarshal(bts, rec2); err != nil {
		t.Fatal(err)
	}

	if !reflect.DeepEqual(rec1, rec2) {
		t.Fatalf("expected %+v, got %+v", rec1, rec2)
	}

	btsj, jerr := json.Marshal(rec1)
	if jerr != nil {
		t.Fatal(jerr)
	}
	fmt.Println(string(btsj))
}

func TestFetch(t *testing.T) {
	st1 := Status{
		Since: time.Now(),
		Cluster: ClusterStatus{
			AgentStatuses: map[string]client.Status{
				"aaa": {State: "active"},
			},
		},
		Round: 10,
		Case:  1,
	}
	sh := fetchHandler{status: &st1}

	srv := httptest.NewServer(sh)
	defer srv.Close()

	st2, err := fetchStatus(srv.URL + "/status")
	if err != nil {
		t.Fatal(err)
	}
	// TODO
	if !reflect.DeepEqual(st1, st2) && fmt.Sprintf("%+v", st1) != fmt.Sprintf("%+v", st2) {
		t.Fatalf("expected %+v, got %+v", st1, st2)
	}

	rm1 := map[string]int64{
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic majority":   138,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic leader":   139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic majority": 139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic all":        139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic one":        139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend sleep 5s":         553,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic all":              138,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic one":              138,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic all":      139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend sleep 5s":       556,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic leader":           138,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic majority":         138,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave sleep 5s":               552,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic one":      139,
		"failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic leader":     138,
	}
	rm2, err := fetchFailedCases(srv.URL + "/metrics")
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(rm1, rm2) && fmt.Sprintf("%+v", rm1) != fmt.Sprintf("%+v", rm2) {
		t.Fatalf("expected %+v, got %+v", rm1, rm2)
	}
}

type fetchHandler struct {
	status *Status
}

func (sh fetchHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/status":
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(Status{
			Since:      sh.status.Since,
			Failures:   sh.status.Failures,
			RoundLimit: sh.status.RoundLimit,
			Cluster:    sh.status.Cluster,
			Round:      sh.status.Round,
			Case:       sh.status.Case,
		}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

	case "/metrics":
		w.Write([]byte(`
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic all"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic leader"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic majority"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic one"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend sleep 5s"} 556
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic all"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic leader"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic majority"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic one"} 139
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend sleep 5s"} 553
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic all"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic leader"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic majority"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic one"} 138
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave sleep 5s"} 552
`))
	}
}

func TestRecordParseFile(t *testing.T) {
	bts, err := ioutil.ReadFile("record")
	if err != nil {
		t.Fatal(err)
	}
	rec := &recordpb.Record{}
	if err = proto.Unmarshal(bts, rec); err != nil {
		t.Fatal(err)
	}
	fmt.Printf("%+v\n", rec)
}
