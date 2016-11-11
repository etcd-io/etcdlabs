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

package metrics

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFetch(t *testing.T) {
	ts := httptest.NewServer(newTesterHandler())
	defer ts.Close()

	curCase, curFailed, err := fetchTester(ts.URL + "/metrics")
	if err != nil {
		t.Fatal(err)
	}
	if curCase != 1805 {
		t.Fatalf("curCase expected 1805, got %d", curCase)
	}
	if curFailed != 1 {
		t.Fatalf("curFailed expected 1, got %d", curFailed)
	}
}

type testerHandler struct{}

func newTesterHandler() http.Handler {
	return &testerHandler{}
}

func (hd *testerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	switch r.URL.Path {
	case "/metrics":
	default:
		http.Error(w, fmt.Sprintf("unknown request path %q", r.URL.Path), http.StatusBadRequest)
		return
	}

	w.Write([]byte(sampleTesterResponse))
}

var sampleTesterResponse = `
# HELP etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds Bucketed histogram of db compaction pause duration.
# TYPE etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds histogram
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="1"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="2"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="4"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="8"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="16"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="32"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="64"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="128"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="256"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="512"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="1024"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="2048"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="4096"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_bucket{le="+Inf"} 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_sum 0
etcd_debugging_mvcc_db_compaction_pause_duration_milliseconds_count 0
# HELP etcd_debugging_mvcc_db_compaction_total_duration_milliseconds Bucketed histogram of db compaction total duration.
# TYPE etcd_debugging_mvcc_db_compaction_total_duration_milliseconds histogram
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="100"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="200"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="400"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="800"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="1600"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="3200"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="6400"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="12800"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="25600"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="51200"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="102400"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="204800"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="409600"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="819200"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_bucket{le="+Inf"} 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_sum 0
etcd_debugging_mvcc_db_compaction_total_duration_milliseconds_count 0
# HELP etcd_debugging_mvcc_db_total_size_in_bytes Total size of the underlying database in bytes.
# TYPE etcd_debugging_mvcc_db_total_size_in_bytes gauge
etcd_debugging_mvcc_db_total_size_in_bytes 0
# HELP etcd_debugging_mvcc_delete_total Total number of deletes seen by this member.
# TYPE etcd_debugging_mvcc_delete_total counter
etcd_debugging_mvcc_delete_total 0
# HELP etcd_debugging_mvcc_events_total Total number of events sent by this member.
# TYPE etcd_debugging_mvcc_events_total counter
etcd_debugging_mvcc_events_total 0
# HELP etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds Bucketed histogram of index compaction pause duration.
# TYPE etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds histogram
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="0.5"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="1"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="2"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="4"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="8"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="16"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="32"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="64"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="128"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="256"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="512"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="1024"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_bucket{le="+Inf"} 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_sum 0
etcd_debugging_mvcc_index_compaction_pause_duration_milliseconds_count 0
# HELP etcd_debugging_mvcc_keys_total Total number of keys.
# TYPE etcd_debugging_mvcc_keys_total gauge
etcd_debugging_mvcc_keys_total 0
# HELP etcd_debugging_mvcc_pending_events_total Total number of pending events to be sent.
# TYPE etcd_debugging_mvcc_pending_events_total gauge
etcd_debugging_mvcc_pending_events_total 0
# HELP etcd_debugging_mvcc_put_total Total number of puts seen by this member.
# TYPE etcd_debugging_mvcc_put_total counter
etcd_debugging_mvcc_put_total 0
# HELP etcd_debugging_mvcc_range_total Total number of ranges seen by this member.
# TYPE etcd_debugging_mvcc_range_total counter
etcd_debugging_mvcc_range_total 0
# HELP etcd_debugging_mvcc_slow_watcher_total Total number of unsynced slow watchers.
# TYPE etcd_debugging_mvcc_slow_watcher_total gauge
etcd_debugging_mvcc_slow_watcher_total 0
# HELP etcd_debugging_mvcc_txn_total Total number of txns seen by this member.
# TYPE etcd_debugging_mvcc_txn_total counter
etcd_debugging_mvcc_txn_total 0
# HELP etcd_debugging_mvcc_watch_stream_total Total number of watch streams.
# TYPE etcd_debugging_mvcc_watch_stream_total gauge
etcd_debugging_mvcc_watch_stream_total 0
# HELP etcd_debugging_mvcc_watcher_total Total number of watchers.
# TYPE etcd_debugging_mvcc_watcher_total gauge
etcd_debugging_mvcc_watcher_total 0
# HELP etcd_debugging_snap_save_marshalling_duration_seconds The marshalling cost distributions of save called by snapshot.
# TYPE etcd_debugging_snap_save_marshalling_duration_seconds histogram
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.001"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.002"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.004"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.008"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.016"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.032"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.064"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.128"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.256"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="0.512"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="1.024"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="2.048"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="4.096"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="8.192"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_bucket{le="+Inf"} 0
etcd_debugging_snap_save_marshalling_duration_seconds_sum 0
etcd_debugging_snap_save_marshalling_duration_seconds_count 0
# HELP etcd_debugging_snap_save_total_duration_seconds The total latency distributions of save called by snapshot.
# TYPE etcd_debugging_snap_save_total_duration_seconds histogram
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.001"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.002"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.004"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.008"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.016"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.032"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.064"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.128"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.256"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="0.512"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="1.024"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="2.048"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="4.096"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="8.192"} 0
etcd_debugging_snap_save_total_duration_seconds_bucket{le="+Inf"} 0
etcd_debugging_snap_save_total_duration_seconds_sum 0
etcd_debugging_snap_save_total_duration_seconds_count 0
# HELP etcd_debugging_store_expires_total Total number of expired keys.
# TYPE etcd_debugging_store_expires_total counter
etcd_debugging_store_expires_total 0
# HELP etcd_debugging_store_watch_requests_total Total number of incoming watch requests (new or reestablished).
# TYPE etcd_debugging_store_watch_requests_total counter
etcd_debugging_store_watch_requests_total 0
# HELP etcd_debugging_store_watchers Count of currently active watchers.
# TYPE etcd_debugging_store_watchers gauge
etcd_debugging_store_watchers 0
# HELP etcd_disk_backend_commit_duration_seconds The latency distributions of commit called by backend.
# TYPE etcd_disk_backend_commit_duration_seconds histogram
etcd_disk_backend_commit_duration_seconds_bucket{le="0.001"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.002"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.004"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.008"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.016"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.032"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.064"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.128"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.256"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="0.512"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="1.024"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="2.048"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="4.096"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="8.192"} 0
etcd_disk_backend_commit_duration_seconds_bucket{le="+Inf"} 0
etcd_disk_backend_commit_duration_seconds_sum 0
etcd_disk_backend_commit_duration_seconds_count 0
# HELP etcd_disk_wal_fsync_duration_seconds The latency distributions of fsync called by wal.
# TYPE etcd_disk_wal_fsync_duration_seconds histogram
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.001"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.002"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.004"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.008"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.016"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.032"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.064"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.128"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.256"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="0.512"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="1.024"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="2.048"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="4.096"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="8.192"} 0
etcd_disk_wal_fsync_duration_seconds_bucket{le="+Inf"} 0
etcd_disk_wal_fsync_duration_seconds_sum 0
etcd_disk_wal_fsync_duration_seconds_count 0
# HELP etcd_funcational_tester_case_failed_total Total number of failed test cases
# TYPE etcd_funcational_tester_case_failed_total counter
etcd_funcational_tester_case_failed_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/afterCommit panic one"} 1
# HELP etcd_funcational_tester_case_total Total number of finished test cases
# TYPE etcd_funcational_tester_case_total counter
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterApplySnap panic all for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterApplySnap panic leader for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterApplySnap panic majority for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterApplySnap panic one for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSave panic all"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSave panic leader"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSave panic majority"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSave panic one"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSaveSnap panic all for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSaveSnap panic leader for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSaveSnap panic majority for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftAfterSaveSnap panic one for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic all"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic leader"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic majority"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeFollowerSend panic one"} 39
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic all"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic leader"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic majority"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeLeaderSend panic one"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic all"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic leader"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic majority"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic one"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSaveSnap panic all for a long time and expect it to recover from an incoming snapshot"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSaveSnap panic leader for a long time and expect it to recover from an incoming snapshot"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSaveSnap panic majority for a long time and expect it to recover from an incoming snapshot"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/etcdserver/raftBeforeSaveSnap panic one for a long time and expect it to recover from an incoming snapshot"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/afterCommit panic all"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/afterCommit panic leader"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/afterCommit panic majority"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/afterCommit panic one"} 38
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/beforeCommit panic all"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/beforeCommit panic leader"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/beforeCommit panic majority"} 37
etcd_funcational_tester_case_total{desc="failpoint github.com/coreos/etcd/mvcc/backend/beforeCommit panic one"} 37
etcd_funcational_tester_case_total{desc="isolate all members"} 39
etcd_funcational_tester_case_total{desc="isolate one member"} 39
etcd_funcational_tester_case_total{desc="kill all members"} 39
etcd_funcational_tester_case_total{desc="kill leader member"} 39
etcd_funcational_tester_case_total{desc="kill leader member for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="kill majority of the cluster"} 39
etcd_funcational_tester_case_total{desc="kill one random member"} 39
etcd_funcational_tester_case_total{desc="kill one random member for a long time and expect it to recover from an incoming snapshot"} 39
etcd_funcational_tester_case_total{desc="slow down all members' network"} 39
etcd_funcational_tester_case_total{desc="slow down leader's network by adding 500 ms latency"} 39
etcd_funcational_tester_case_total{desc="slow down one member's network by adding 500 ms latency"} 39
# HELP etcd_funcational_tester_round_failed_total Total number of failed test rounds.
# TYPE etcd_funcational_tester_round_failed_total counter
etcd_funcational_tester_round_failed_total 1
# HELP etcd_funcational_tester_round_total Total number of finished test rounds.
# TYPE etcd_funcational_tester_round_total counter
etcd_funcational_tester_round_total 39
# HELP etcd_server_has_leader Whether or not a leader exists. 1 is existence, 0 is not.
# TYPE etcd_server_has_leader gauge
etcd_server_has_leader 0
# HELP etcd_server_leader_changes_seen_total The number of leader changes seen.
# TYPE etcd_server_leader_changes_seen_total counter
etcd_server_leader_changes_seen_total 0
# HELP etcd_server_proposals_applied_total The total number of consensus proposals applied.
# TYPE etcd_server_proposals_applied_total gauge
etcd_server_proposals_applied_total 0
# HELP etcd_server_proposals_committed_total The total number of consensus proposals committed.
# TYPE etcd_server_proposals_committed_total gauge
etcd_server_proposals_committed_total 0
# HELP etcd_server_proposals_failed_total The total number of failed proposals seen.
# TYPE etcd_server_proposals_failed_total counter
etcd_server_proposals_failed_total 0
# HELP etcd_server_proposals_pending The current number of pending proposals to commit.
# TYPE etcd_server_proposals_pending gauge
etcd_server_proposals_pending 0
# HELP go_gc_duration_seconds A summary of the GC invocation durations.
# TYPE go_gc_duration_seconds summary
go_gc_duration_seconds{quantile="0"} 0.00022510000000000002
go_gc_duration_seconds{quantile="0.25"} 0.000400068
go_gc_duration_seconds{quantile="0.5"} 0.000444779
go_gc_duration_seconds{quantile="0.75"} 0.000476412
go_gc_duration_seconds{quantile="1"} 0.0033185510000000003
go_gc_duration_seconds_sum 130.127909247
go_gc_duration_seconds_count 303899
# HELP go_goroutines Number of goroutines that currently exist.
# TYPE go_goroutines gauge
go_goroutines 648
# HELP go_memstats_alloc_bytes Number of bytes allocated and still in use.
# TYPE go_memstats_alloc_bytes gauge
go_memstats_alloc_bytes 1.4713456e+07
# HELP go_memstats_alloc_bytes_total Total number of bytes allocated, even if freed.
# TYPE go_memstats_alloc_bytes_total counter
go_memstats_alloc_bytes_total 1.61912282996e+12
# HELP go_memstats_buck_hash_sys_bytes Number of bytes used by the profiling bucket hash table.
# TYPE go_memstats_buck_hash_sys_bytes gauge
go_memstats_buck_hash_sys_bytes 1.985782e+06
# HELP go_memstats_frees_total Total number of frees.
# TYPE go_memstats_frees_total counter
go_memstats_frees_total 1.8631959379e+10
# HELP go_memstats_gc_sys_bytes Number of bytes used for garbage collection system metadata.
# TYPE go_memstats_gc_sys_bytes gauge
go_memstats_gc_sys_bytes 1.615872e+06
# HELP go_memstats_heap_alloc_bytes Number of heap bytes allocated and still in use.
# TYPE go_memstats_heap_alloc_bytes gauge
go_memstats_heap_alloc_bytes 1.4713456e+07
# HELP go_memstats_heap_idle_bytes Number of heap bytes waiting to be used.
# TYPE go_memstats_heap_idle_bytes gauge
go_memstats_heap_idle_bytes 6.67648e+06
# HELP go_memstats_heap_inuse_bytes Number of heap bytes that are in use.
# TYPE go_memstats_heap_inuse_bytes gauge
go_memstats_heap_inuse_bytes 1.8456576e+07
# HELP go_memstats_heap_objects Number of allocated objects.
# TYPE go_memstats_heap_objects gauge
go_memstats_heap_objects 126718
# HELP go_memstats_heap_released_bytes_total Total number of heap bytes released to OS.
# TYPE go_memstats_heap_released_bytes_total counter
go_memstats_heap_released_bytes_total 0
# HELP go_memstats_heap_sys_bytes Number of heap bytes obtained from system.
# TYPE go_memstats_heap_sys_bytes gauge
go_memstats_heap_sys_bytes 2.5133056e+07
# HELP go_memstats_last_gc_time_seconds Number of seconds since 1970 of last garbage collection.
# TYPE go_memstats_last_gc_time_seconds gauge
go_memstats_last_gc_time_seconds 1.478738201506712e+19
# HELP go_memstats_lookups_total Total number of pointer lookups.
# TYPE go_memstats_lookups_total counter
go_memstats_lookups_total 316843
# HELP go_memstats_mallocs_total Total number of mallocs.
# TYPE go_memstats_mallocs_total counter
go_memstats_mallocs_total 1.8632086097e+10
# HELP go_memstats_mcache_inuse_bytes Number of bytes in use by mcache structures.
# TYPE go_memstats_mcache_inuse_bytes gauge
go_memstats_mcache_inuse_bytes 4800
# HELP go_memstats_mcache_sys_bytes Number of bytes used for mcache structures obtained from system.
# TYPE go_memstats_mcache_sys_bytes gauge
go_memstats_mcache_sys_bytes 16384
# HELP go_memstats_mspan_inuse_bytes Number of bytes in use by mspan structures.
# TYPE go_memstats_mspan_inuse_bytes gauge
go_memstats_mspan_inuse_bytes 360320
# HELP go_memstats_mspan_sys_bytes Number of bytes used for mspan structures obtained from system.
# TYPE go_memstats_mspan_sys_bytes gauge
go_memstats_mspan_sys_bytes 442368
# HELP go_memstats_next_gc_bytes Number of heap bytes when next garbage collection will take place.
# TYPE go_memstats_next_gc_bytes gauge
go_memstats_next_gc_bytes 1.3997377e+07
# HELP go_memstats_other_sys_bytes Number of bytes used for other system allocations.
# TYPE go_memstats_other_sys_bytes gauge
go_memstats_other_sys_bytes 754690
# HELP go_memstats_stack_inuse_bytes Number of bytes in use by the stack allocator.
# TYPE go_memstats_stack_inuse_bytes gauge
go_memstats_stack_inuse_bytes 6.324224e+06
# HELP go_memstats_stack_sys_bytes Number of bytes obtained from system for stack allocator.
# TYPE go_memstats_stack_sys_bytes gauge
go_memstats_stack_sys_bytes 6.324224e+06
# HELP go_memstats_sys_bytes Number of bytes obtained by system. Sum of all system allocations.
# TYPE go_memstats_sys_bytes gauge
go_memstats_sys_bytes 3.6272376e+07
# HELP grpc_client_handled_total Total number of RPCs completed by the client, regardless of success or failure.
# TYPE grpc_client_handled_total counter
grpc_client_handled_total{grpc_code="Canceled",grpc_method="Watch",grpc_service="etcdserverpb.Watch",grpc_type="bidi_stream"} 143
grpc_client_handled_total{grpc_code="DeadlineExceeded",grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 64
grpc_client_handled_total{grpc_code="DeadlineExceeded",grpc_method="Status",grpc_service="etcdserverpb.Maintenance",grpc_type="unary"} 2
grpc_client_handled_total{grpc_code="FailedPrecondition",grpc_method="LeaseKeepAlive",grpc_service="etcdserverpb.Lease",grpc_type="bidi_stream"} 63742
grpc_client_handled_total{grpc_code="Internal",grpc_method="LeaseKeepAlive",grpc_service="etcdserverpb.Lease",grpc_type="bidi_stream"} 63633
grpc_client_handled_total{grpc_code="Internal",grpc_method="Watch",grpc_service="etcdserverpb.Watch",grpc_type="bidi_stream"} 42
grpc_client_handled_total{grpc_code="OK",grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 25350
grpc_client_handled_total{grpc_code="OK",grpc_method="Status",grpc_service="etcdserverpb.Maintenance",grpc_type="unary"} 38123
grpc_client_handled_total{grpc_code="Unavailable",grpc_method="LeaseKeepAlive",grpc_service="etcdserverpb.Lease",grpc_type="bidi_stream"} 1
grpc_client_handled_total{grpc_code="Unavailable",grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 1
grpc_client_handled_total{grpc_code="Unknown",grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 17
# HELP grpc_client_msg_received_total Total number of RPC stream messages received by the client.
# TYPE grpc_client_msg_received_total counter
grpc_client_msg_received_total{grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 82
grpc_client_msg_received_total{grpc_method="Status",grpc_service="etcdserverpb.Maintenance",grpc_type="unary"} 2
grpc_client_msg_received_total{grpc_method="Watch",grpc_service="etcdserverpb.Watch",grpc_type="bidi_stream"} 370
# HELP grpc_client_msg_sent_total Total number of gRPC stream messages sent by the client.
# TYPE grpc_client_msg_sent_total counter
grpc_client_msg_sent_total{grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 25432
grpc_client_msg_sent_total{grpc_method="Status",grpc_service="etcdserverpb.Maintenance",grpc_type="unary"} 38125
grpc_client_msg_sent_total{grpc_method="Watch",grpc_service="etcdserverpb.Watch",grpc_type="bidi_stream"} 185
# HELP grpc_client_started_total Total number of RPCs started on the client.
# TYPE grpc_client_started_total counter
grpc_client_started_total{grpc_method="LeaseKeepAlive",grpc_service="etcdserverpb.Lease",grpc_type="bidi_stream"} 127376
grpc_client_started_total{grpc_method="Put",grpc_service="etcdserverpb.KV",grpc_type="unary"} 25432
grpc_client_started_total{grpc_method="Status",grpc_service="etcdserverpb.Maintenance",grpc_type="unary"} 38125
grpc_client_started_total{grpc_method="Watch",grpc_service="etcdserverpb.Watch",grpc_type="bidi_stream"} 185
# HELP http_request_duration_microseconds The HTTP request latencies in microseconds.
# TYPE http_request_duration_microseconds summary
http_request_duration_microseconds{handler="prometheus",quantile="0.5"} 2287.513
http_request_duration_microseconds{handler="prometheus",quantile="0.9"} 4697.054
http_request_duration_microseconds{handler="prometheus",quantile="0.99"} 10139.772
http_request_duration_microseconds_sum{handler="prometheus"} 6.354635532000002e+06
http_request_duration_microseconds_count{handler="prometheus"} 1853
# HELP http_request_size_bytes The HTTP request sizes in bytes.
# TYPE http_request_size_bytes summary
http_request_size_bytes{handler="prometheus",quantile="0.5"} 240
http_request_size_bytes{handler="prometheus",quantile="0.9"} 240
http_request_size_bytes{handler="prometheus",quantile="0.99"} 240
http_request_size_bytes_sum{handler="prometheus"} 444720
http_request_size_bytes_count{handler="prometheus"} 1853
# HELP http_requests_total Total number of HTTP requests made.
# TYPE http_requests_total counter
http_requests_total{code="200",handler="prometheus",method="get"} 1853
# HELP http_response_size_bytes The HTTP response sizes in bytes.
# TYPE http_response_size_bytes summary
http_response_size_bytes{handler="prometheus",quantile="0.5"} 3585
http_response_size_bytes{handler="prometheus",quantile="0.9"} 3600
http_response_size_bytes{handler="prometheus",quantile="0.99"} 3604
http_response_size_bytes_sum{handler="prometheus"} 6.550894e+06
http_response_size_bytes_count{handler="prometheus"} 1853
# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 22365.56
# HELP process_max_fds Maximum number of open file descriptors.
# TYPE process_max_fds gauge
process_max_fds 1024
# HELP process_open_fds Number of open file descriptors.
# TYPE process_open_fds gauge
process_open_fds 24
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 4.9860608e+07
# HELP process_start_time_seconds Start time of the process since unix epoch in seconds.
# TYPE process_start_time_seconds gauge
process_start_time_seconds 1.47871966657e+09
# HELP process_virtual_memory_bytes Virtual memory size in bytes.
# TYPE process_virtual_memory_bytes gauge
process_virtual_memory_bytes 3.99310848e+08
`
