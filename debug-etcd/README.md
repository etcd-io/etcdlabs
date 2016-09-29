# Links

- Logs/data
	- functional-tester: [Link Here](https://console.cloud.google.com/storage/browser/etcd-functional-tester)
- GitHub open issues
	- functional-tester: [Link Here](https://github.com/coreos/etcd/issues?q=is%3Aopen+is%3Aissue+label%3Acomponent%2Ffunctional-tester)
- GitHub closed issues
	- functional-tester: [Link Here](https://github.com/coreos/etcd/issues?q=is%3Aissue+label%3Acomponent%2Ffunctional-tester+is%3Aclosed)

<br>

# Debug etcd

- TODO [Same revision, different hash](#same-revision-different-hash)
- [Intensive stresser with `etcdserver.ErrTooManyRequests`](#intensive-stresser-with-etcdservererrtoomanyrequests)
- TODO [Performance regression from unnecessary locking, Go compiler](#performance-regression-from-unnecessary-locking-go-compiler)
- TODO [Panic before commit makes WAL inconsistent](#panic-before-commit-makes-wal-inconsistent)
- [Retry client requests with `etcdserver.ErrTimeoutDueToLeaderFail`](#retry-client-requests-with-etcdservererrtimeoutduetoleaderfail)
- [Intensive writes can trigger live-lock](#intensive-writes-can-trigger-live-lock)
- TODO [Intensive writes can trigger snapshot cycle](#intensive-writes-can-trigger-snapshot-cycle)
- [Retry client requests when etcd is ready](#retry-client-requests-when-etcd-is-ready)
- TODO [Message is delivered only one way](#message-is-delivered-only-one-way)

[↑ top](#debug-etcd)
<br><br><br><br><hr>









#### Same revision, different hash

TODO

###### Problem

3 nodes had same revision, but different hash, right after leader election

###### Investigation

- Reported at https://github.com/coreos/etcd/issues/6272

Testing cluster was deployed after this commit https://github.com/coreos/etcd/commit/6655afda4b1d179a81d14e5979f9cdabe847d870

```bash
$ grep -r "2016-08-25 01:24:0" tester.log

2016-08-25 01:24:05.473748 I | etcd-tester: [round#20568 case#1] injecting failure "kill majority of the cluster"
2016-08-25 01:24:05.575080 I | etcd-tester: [round#20568 case#1] injected failure
2016-08-25 01:24:05.575108 I | etcd-tester: [round#20568 case#1] recovering failure "kill majority of the cluster"
2016-08-25 01:24:05.698586 I | etcd-tester: [round#20568 case#1] recovered failure
2016-08-25 01:24:05.698632 I | etcd-tester: [round#20568 case#1] canceling the stressers...
2016-08-25 01:24:05.701373 I | etcd-tester: stresser "10.240.0.2:2379" is canceled
2016-08-25 01:24:05.702445 I | etcd-tester: stresser "10.240.0.3:2379" is canceled
2016-08-25 01:24:05.704146 I | etcd-tester: stresser "10.240.0.4:2379" is canceled
2016-08-25 01:24:05.704188 I | etcd-tester: [round#20568 case#1] canceled stressers
2016-08-25 01:24:05.704204 I | etcd-tester: [round#20568 case#1] updating current revisions...
2016-08-25 01:24:08.008109 I | etcd-tester: [round#20568 case#1] updated current revisions with 5884913683
2016-08-25 01:24:08.008167 I | etcd-tester: [round#20568 case#1] all members are consistent with current revisions [revisions: map[http://10.240.0.3:2379:5884913683 http://10.240.0.4:2379:5884913683 http://10.240.0.2:2379:5884913683]]
2016-08-25 01:24:08.008182 I | etcd-tester: [round#20568 case#1] checking current storage hashes...
2016-08-25 01:24:08.008201 I | etcd-tester: [round#20568 case#1] checking current storage hashes failed [hashes: map[http://10.240.0.2:2379:3548456414 http://10.240.0.3:2379:2266812011 http://10.240.0.4:2379:2266812011]]
2016-08-25 01:24:08.008214 I | etcd-tester: [round#20568 case#1] starting the stressers...
2016-08-25 01:24:08.008408 I | etcd-tester: stresser "10.240.0.2:2379" is started
2016-08-25 01:24:08.008526 I | etcd-tester: stresser "10.240.0.3:2379" is started
2016-08-25 01:24:08.008645 I | etcd-tester: stresser "10.240.0.4:2379" is started
2016-08-25 01:24:08.008676 I | etcd-tester: [round#20568 case#1] started stressers
2016-08-25 01:24:08.008701 I | etcd-tester: [round#20568 case#1] cleaning up...
...
```

- `agent01` had leader election at `2016-08-25 01:24:07.966513`, right before we get same revision

	```
	$ grep -r "2016-08-25 01:24:0" agent01/etcd-log/etcd.log

	2016-08-25 01:24:07.966513 I | raft: raft.node: agent01 elected leader agent02 at term 127023
	2016-08-25 01:24:07.973599 I | embed: ready to serve client requests
	2016-08-25 01:24:07.973672 I | etcdserver: published {Name:etcd-0 ClientURLs:[http://10.240.0.2:2379]} to cluster 5b598ebb924f57a0
	2016-08-25 01:24:07.973880 E | etcdmain: forgot to set Type=notify in systemd service file?
	2016-08-25 01:24:07.974016 N | embed: serving insecure client requests on 10.240.0.2:2379, this is strongly discouraged!
	```

- Same revision at `2016-08-25 01:24:08.008167`

	```
	10.240.0.3:2379 (agent01): 5884913683
	10.240.0.4:2379 (agent02): 5884913683
	10.240.0.2:2379 (agent03): 5884913683
	```

- But different hash

	```
	10.240.0.2:2379 (agent01): 3548456414
	10.240.0.3:2379 (agent02): 2266812011
	10.240.0.4:2379 (agent03): 2266812011
	```



# db1
Total Size:       90 MB
Current Revision: 5884913671
Consistent Index: 7503071016
Total Key:        26667
Hash:             1803398362 (6B7DACDA)

# db2
Total Size:       90 MB
Current Revision: 5884913683
Consistent Index: 7503074141
Total Key:        26697
Hash:             2713887534 (A1C2A32E)

Total Size:       90 MB
Current Revision: 5884913671
Consistent Index: 7503074129
Total Key:        26667
Hash:             3615825114 (D7851CDA)


- Snapshot status doesn't tell much

	```bash
	$ ETCDCTL_API=3 etcdctl snapshot status agent01/agent.etcd/member/snap/db --write-out=table
	+----------+------------+------------+------------+
	|   HASH   |  REVISION  | TOTAL KEYS | TOTAL SIZE |
	+----------+------------+------------+------------+
	| 6b7dacda | 5884913671 |      26667 | 90 MB      |
	+----------+------------+------------+------------+

	$ ETCDCTL_API=3 etcdctl snapshot status agent02/agent.etcd/member/snap/db --write-out=table
	+----------+------------+------------+------------+
	|   HASH   |  REVISION  | TOTAL KEYS | TOTAL SIZE |
	+----------+------------+------------+------------+
	| 5666d797 | 5884925456 |      48121 | 90 MB      |
	+----------+------------+------------+------------+

	$ ETCDCTL_API=3 etcdctl snapshot status agent03/agent.etcd/member/snap/db --write-out=table
	+----------+------------+------------+------------+
	|   HASH   |  REVISION  | TOTAL KEYS | TOTAL SIZE |
	+----------+------------+------------+------------+
	| e63b114c | 5884925569 |      48359 | 90 MB      |
	+----------+------------+------------+------------+
	```

- Last lines of WAL files show that `agent01` was behind

	```
	$ etcd-dump-logs -data-dir agent01/agent.etcd

	Snapshot:
	term=127020 index=7503064459 nodes=[3f9bde2d52f7b105 6eede0f9d7f0149d cf12e7f20fbe1841]
	Start dupmping log entries from snapshot.
	WAL metadata:
	nodeID=3f9bde2d52f7b105 clusterID=5b598ebb924f57a0 term=127023 commitIndex=7503071016 vote=cf12e7f20fbe1841
	WAL entries:
	lastIndex=7503071030
	...
	127023	7503071028	norm	header:<ID:1747773510010155870 > put:<key:"foo0000000000035cc9" value:"osyhzecvvbnwoxkoentkfcjwoxbpvhttheqkabfnezvudqcdeyekiookfsjaiwqejnajnnocoebbjfytohhbgfdzhtnudgkrfosl" > 
	127023	7503071029	norm	header:<ID:1747773510010155869 > range:<key:"foo000000000003b7f2" > 
	127023	7503071030	norm	header:<ID:1747773510010155871 > range:<key:"foo000000000000473e" range_end:"foo0000000000004932" > 


	$ etcd-dump-logs -data-dir agent02/agent.etcd

	Snapshot:
	term=127023 index=7503076726 nodes=[3f9bde2d52f7b105 6eede0f9d7f0149d cf12e7f20fbe1841]
	Start dupmping log entries from snapshot.
	WAL metadata:
	nodeID=cf12e7f20fbe1841 clusterID=5b598ebb924f57a0 term=127023 commitIndex=7503086058 vote=cf12e7f20fbe1841
	WAL entries:
	lastIndex=7503086129
	...
	127023	7503086127	norm	header:<ID:1485438831716326323 > put:<key:"foo00000000000244e0" value:"ntjzhtdquuszrkokffuminecsmnekpkuitngabhzdmtcuekzvrycilxolknzvnfxfdhtemqrblbzpefkelxverhsaophbqifjfhj" > 
	127023	7503086128	norm	header:<ID:1485438831716326324 > put:<key:"foo0000000000015e8a" value:"svmcorpnkvfbypzzxgqapuhwhxutezwpsrvcpcpcrkqvewjlrwzkzmdsjlkmslrlmgokbhfzpvhwvxmkexiutznbcpjznrglckyy" > 
	127023	7503086129	norm	header:<ID:1485438831716326325 > put:<key:"foo00000000000189c5" value:"eaznmushabegnwegcicbjnuythciueuavofsuuholgzitoxmzbotohstnmpkwztafnyrxoooqkdyrkhwjfhxapbdckodaspmikhx" > 


	$ etcd-dump-logs -data-dir agent03/agent.etcd

	Snapshot:
	term=127023 index=7503081537 nodes=[3f9bde2d52f7b105 6eede0f9d7f0149d cf12e7f20fbe1841]
	Start dupmping log entries from snapshot.
	WAL metadata:
	nodeID=6eede0f9d7f0149d clusterID=5b598ebb924f57a0 term=127023 commitIndex=7503086058 vote=6eede0f9d7f0149d
	WAL entries:
	lastIndex=7503086129
	...
	127023	7503086127	norm	header:<ID:1485438831716326323 > put:<key:"foo00000000000244e0" value:"ntjzhtdquuszrkokffuminecsmnekpkuitngabhzdmtcuekzvrycilxolknzvnfxfdhtemqrblbzpefkelxverhsaophbqifjfhj" > 
	127023	7503086128	norm	header:<ID:1485438831716326324 > put:<key:"foo0000000000015e8a" value:"svmcorpnkvfbypzzxgqapuhwhxutezwpsrvcpcpcrkqvewjlrwzkzmdsjlkmslrlmgokbhfzpvhwvxmkexiutznbcpjznrglckyy" > 
	127023	7503086129	norm	header:<ID:1485438831716326325 > put:<key:"foo00000000000189c5" value:"eaznmushabegnwegcicbjnuythciueuavofsuuholgzitoxmzbotohstnmpkwztafnyrxoooqkdyrkhwjfhxapbdckodaspmikhx" > 
	```


###### Action

- Resolved via https://github.com/coreos/etcd/pull/6279

[↑ top](#debug-etcd)
<br><br><br><br><hr>











#### Intensive stresser with `etcdserver.ErrTooManyRequests`

`etcdserver.ErrTooManyRequests` error is an expected behavior for expensive queries,
such as ranging the entire key-value space. functional-tester should not fail from
trying those queries. And regarding `too slow` errors, we were using the rate-limiter
the wrong way. Rate limiter in etcd limits tokens per second by default. So there was
no need to set rate interval.

###### Problem

- `etcd-tester` failed from:
	- `context deadline exceeded`
	- `etcdserver: too many requests`
	- `injection error: cluster too slow: only commit 9087 requests in 30s`

###### Investigation

- Reported at https://github.com/coreos/etcd/issues/5950
- If stresser is too intensive (writes, reads, deletes, etc. with QPS >15,000), `etcd-tester` failed either
	from `context deadline exceeded` or `etcdserver: too many requests`.

	```
	2016-08-04 18:54:43.384135 I | etcd-tester: [round#2 case#10] injecting failure "slow down all members' network"
	2016-08-04 18:54:45.844818 I | etcd-tester: [round#2 case#10] injected failure
	2016-08-04 18:54:45.844868 I | etcd-tester: [round#2 case#10] recovering failure "slow down all members' network"
	2016-08-04 18:55:14.600794 W | etcd-tester: #0 setHealthKey error (context deadline exceeded (http://10.240.0.13:2379))
	2016-08-04 18:55:16.601800 W | etcd-tester: #1 setHealthKey error (context deadline exceeded (http://10.240.0.13:2379))
	2016-08-04 18:55:18.602700 W | etcd-tester: #2 setHealthKey error (context deadline exceeded (http://10.240.0.13:2379))
	2016-08-04 18:55:20.603592 W | etcd-tester: #3 setHealthKey error (context deadline exceeded (http://10.240.0.13:2379))
	...
	```

	This is because at the same time, the server side complains:

	```
	2016-08-04 18:55:18.192136 W | etcdserver: avoid queries with large range/delete range!
	2016-08-04 18:55:18.211402 W | etcdserver: apply entries took too long [19.241361ms for 1 entries]
	2016-08-04 18:55:18.211451 W | etcdserver: avoid queries with large range/delete range!
	2016-08-04 18:55:18.264797 W | etcdserver: apply entries took too long [24.369379ms for 1 entries]
	2016-08-04 18:55:18.264850 W | etcdserver: avoid queries with large range/delete range!
	2016-08-04 18:55:18.292144 W | etcdserver: apply entries took too long [26.692088ms for 1 entries]
	```

- Even with lighter workload (QPS <10,000), etcd-tester failed from `cluster too slow: only commit XXX requests in 30s`.
	This is because etcd-tester expected at least 10,000 stress requests processed within 30 seconds,
	and read or delete requests sometimes took longer, making applier fall behind and returning `etcdserver: too many requests`.

	```
	2016-08-04 19:29:12.596001 I | etcd-tester: [DEBUG] stresser error rpc error: code = 2 desc = etcdserver: too many requests (<nil>, context canceled)
	2016-08-04 19:29:12.596083 I | etcd-tester: [DEBUG] stresser error rpc error: code = 2 desc = etcdserver: too many requests (<nil>, context canceled)
	2016-08-04 19:29:13.510437 W | etcd-tester: #1 setHealthKey error (etcdserver: too many requests (http://10.240.0.17:2379))
	...
	2016-08-04 19:53:22.544409 I | etcd-tester: [round#1 case#4] injection error: cluster too slow: only commit 9087 requests in 30s
	```

- `stresser` did not retry with `etcdserver: too many requests`, which then exits.


###### Action

- Resolved via https://github.com/coreos/etcd/pull/6123

[↑ top](#debug-etcd)
<br><br><br><br><hr>











#### Performance regression from unnecessary locking, Go compiler

TODO

Make sure to not place mutexes when they are not needed.

###### Problem

- `benchmark` tool showed that the serializable range performance got two times slower with latest grpc change.
- `etcd`'s expected serializable read performance is 100,000 requests per second, but it was getting only 48,000 QPS.

###### Investigation

- Reported at https://github.com/coreos/etcd/issues/6010
- Ran more benchmarks, but kept getting same results.
- Bisect the grpc code base and found the exact commit that introduces the regression.
- When grpc changes its [error type from `grpc.rpcError` to `*grpc.rpcError`](https://github.com/grpc/grpc-go/commit/ffdfb592e8ac60f3f9ca4889661eabfe09c11628), etcd performance got affected.
- Ran grpc's benchmark suites, but they didn't show any regression.
- Ran etcd `benchmark` with different Go versions and different grpc error types.
- Found that Go 1.7rc3 with `*grpc.rpcError` had slower performance, while Go 1.6.3 with `grpc.rpcError` had expected performance.
- For 1 node cluster:

	```
	master branch with *grpc.rpcError, 1 node cluster
	go 1.6    : 15339.9802
	go 1.6.3  : 14402.0303
	go 1.7    : 15605.9624
	go master : 16836.9583

	test branch with grpc.rpcError, 1 node cluster
	go 1.6    : 31372.9589
	go 1.6.3  : 27012.3428
	go 1.7    : 17090.2322
	go master : 16823.8769
	```

- Looking at the code base, we found `etcdserver` was placing unnecessary locks, slowing down the serializable range performance.
- Removing unnecessary mutexes gave back the performance, but still need to figure out why Go behaves this way.


###### Action

- Resolved via https://github.com/coreos/etcd/pull/6054

[↑ top](#debug-etcd)
<br><br><br><br><hr>











#### Panic before commit makes WAL inconsistent

TODO

###### Problem

- Reported at
	- https://github.com/coreos/etcd/issues/5946
	- https://github.com/coreos/etcd/issues/6271
- `2016-07-14 22:46:16.982086 (UTC)` in functional-tester cluster
- etcd-tester complains one node has different key-value database revision than other two nodes
- etcd-tester retries maximum 7 times in case applier takes longer to commit those entries
- However, storage stays inconsistent regardlessly

```
2016-07-14 22:46:16.982086 I | etcd-tester: [round#4 case#33] injecting failure "failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic majority"
2016-07-14 22:46:19.984622 I | etcd-tester: [round#4 case#33] injected failure
2016-07-14 22:46:19.984684 I | etcd-tester: [round#4 case#33] recovering failure "failpoint github.com/coreos/etcd/etcdserver/raftBeforeSave panic majority"
2016-07-14 22:46:19.989031 I | etcd-tester: [round#4 case#33] recovered failure
2016-07-14 22:46:19.989044 I | etcd-tester: [round#4 case#33] canceling the stressers...
2016-07-14 22:46:19.989810 I | etcd-tester: stresser "10.240.0.19:2379" is canceled
2016-07-14 22:46:19.990322 I | etcd-tester: stresser "10.240.0.20:2379" is canceled
2016-07-14 22:46:19.990736 I | etcd-tester: stresser "10.240.0.22:2379" is canceled
2016-07-14 22:46:19.990750 I | etcd-tester: [round#4 case#33] canceled stressers
2016-07-14 22:46:19.990757 I | etcd-tester: [round#4 case#33] updating current revisions...
2016-07-14 22:46:23.915289 I | etcd-tester: [round#4 case#33] #0 inconsistent current revisions map[http://10.240.0.19:2379:3452538 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]
2016-07-14 22:46:25.384638 I | etcd-tester: [round#4 case#33] #1 inconsistent current revisions map[http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]
2016-07-14 22:46:26.860232 I | etcd-tester: [round#4 case#33] #2 inconsistent current revisions map[http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]
2016-07-14 22:46:28.335462 I | etcd-tester: [round#4 case#33] #3 inconsistent current revisions map[http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]
2016-07-14 22:46:29.805919 I | etcd-tester: [round#4 case#33] #4 inconsistent current revisions map[http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]
2016-07-14 22:46:31.294147 I | etcd-tester: [round#4 case#33] #5 inconsistent current revisions map[http://10.240.0.22:2379:3452680 http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681]
2016-07-14 22:46:32.778348 I | etcd-tester: [round#4 case#33] #6 inconsistent current revisions map[http://10.240.0.22:2379:3452680 http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681]
2016-07-14 22:46:32.778403 I | etcd-tester: [round#4 case#33] updated current revisions with 3452681
2016-07-14 22:46:32.778418 I | etcd-tester: [round#4 case#33] checking current revisions failed [revisions: map[http://10.240.0.19:2379:3452681 http://10.240.0.20:2379:3452681 http://10.240.0.22:2379:3452680]]
2016-07-14 22:46:32.778425 I | etcd-tester: [round#4 case#33] starting the stressers...
2016-07-14 22:46:32.778597 I | etcd-tester: stresser "10.240.0.19:2379" is started
2016-07-14 22:46:32.778716 I | etcd-tester: stresser "10.240.0.20:2379" is started
2016-07-14 22:46:32.778902 I | etcd-tester: stresser "10.240.0.22:2379" is started
2016-07-14 22:46:32.778913 I | etcd-tester: [round#4 case#33] started stressers
2016-07-14 22:46:32.778932 I | etcd-tester: [round#4] cleaning up...
```

###### Investigation

- Added more logging to find out if there was any ongoing writes while comparing the revisions

###### Action

- Resolved via
	- https://github.com/coreos/etcd/pull/6267
	- https://github.com/coreos/etcd/pull/6310

[↑ top](#debug-etcd)
<br><br><br><br><hr>










#### Retry client requests with `etcdserver.ErrTimeoutDueToLeaderFail`

When leader fails or failure is injected to the leader, client requests from followers
are expected to receive `etcdserver.ErrTimeoutDueToLeaderFail` from losing their leader.
Client should retry sending its requests to the next new leader.

###### Problem

- `2016-06-28 02:43:09.645088 (UTC)` in functional-tester cluster
- etcd-tester writes didn't go through, so tester failed as below:

```
2016-06-28 02:43:13.309682 I | etcd-tester: [round#10 case#4] injection error: cluster too slow: only commit 0 requests in 30s
2016-06-28 02:43:13.309755 I | etcd-tester: [round#10 case#4] cleaning up...
```

###### Investigation

- Added more logging to find why client write requests were failing
- error was `etcdserver: request timed out, possibly due to previous leader failure`
- Which means that followers' client requests were failing from the failed, old leader

###### Action

- Resolved via https://github.com/coreos/etcd/pull/5788
- Similar issue reported at https://github.com/coreos/etcd/issues/5804
	- Resolved via https://github.com/coreos/etcd/pull/5805

[↑ top](#debug-etcd)
<br><br><br><br><hr>










#### Intensive writes can trigger live-lock

Intensive writes can cause live-locks between concurrent goroutines.
Using buffered channel can make them non-blocking.

###### Problem

- Reported at https://github.com/coreos/etcd/issues/5679
- `2016-06-16 06:58:43 (UTC)` in functional-tester cluster.
- etcd client requests timed out for unknown reasons.
- A follower node was returning `etcdserver: publish error: etcdserver: request timed out`.
	- Then stopped serving client requests silently, after leader election.

###### Investigation

- Happened much more frequently with more CPUs.
- Added more logging to see if it happens from snapshot cycle.
	- Confirmed that there was no snapshot to apply.
- In the 3-node cluster, leader had no problem.
- Only one follower was in live-lock state, serving no client requests after leader election.
- Added stack trace logging for such cases.
	- syscall.SIGQUIT https://github.com/coreos/etcd/pull/5684

```
2016-06-16 06:58:50.792304 I | fileutil: purged file agent.etcd/member/wal/00000000000000cb-0000000004fc39cc.wal successfully
2016-06-16 06:58:50.812194 I | raft: e488cd62cd437e82 [term: 444] received a MsgHeartbeat message with higher term from 74f1165d54038d83 [term: 445]
2016-06-16 06:58:50.812275 I | raft: e488cd62cd437e82 became follower at term 445
2016-06-16 06:58:50.841430 I | raft: raft.node: e488cd62cd437e82 elected leader 74f1165d54038d83 at term 445
2016-06-16 06:58:50.884993 W | rafthttp: closed an existing TCP streaming connection with peer 190bd7e7201d8e9 (stream Message writer)
2016-06-16 06:58:50.885032 I | rafthttp: established a TCP streaming connection with peer 190bd7e7201d8e9 (stream Message writer)
2016-06-16 06:58:57.782273 E | etcdserver: publish error: etcdserver: request timed out
```

Stack trace shows

```
2016-06-16 07:00:43.211057 E | etcdserver: publish error: etcdserver: request timed out
SIGQUIT: quit
PC=0x45ed51 m=0

goroutine 0 [idle]:
runtime.futex(0x120e1b0, 0x0, 0x0, 0x0, 0x0, 0x120d860, 0x0, 0x0, 0x7ffc2b20dec0, 0x40dd52, ...)
	/home/gyuho/go-master/src/runtime/sys_linux_amd64.s:387 +0x21
runtime.futexsleep(0x120e1b0, 0x0, 0xffffffffffffffff)
	/home/gyuho/go-master/src/runtime/os_linux.go:45 +0x62
runtime.notesleep(0x120e1b0)
	/home/gyuho/go-master/src/runtime/lock_futex.go:145 +0x82
runtime.stopm()
	/home/gyuho/go-master/src/runtime/proc.go:1567 +0xad
runtime.findrunnable(0xc420019500, 0x0)
	/home/gyuho/go-master/src/runtime/proc.go:1994 +0x228
runtime.schedule()
	/home/gyuho/go-master/src/runtime/proc.go:2093 +0x14c
runtime.park_m(0xc4200611e0)
	/home/gyuho/go-master/src/runtime/proc.go:2156 +0x123
runtime.mcall(0x7ffc2b20e060)
	/home/gyuho/go-master/src/runtime/asm_amd64.s:240 +0x5b

goroutine 1 [chan receive, 1 minutes]:
github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain.startEtcd(0xc42002fc00, 0x0, 0x0, 0x0)
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain/etcd.go:397 +0x1b53
github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain.startEtcdOrProxyV2()
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain/etcd.go:116 +0x13f4
github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain.Main()
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdmain/main.go:36 +0x4d
main.main()
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/main.go:28 +0x14

# omitted...

goroutine 84 [select]:
github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.(*node).Tick(0xc4230b7040)
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/node.go:381 +0xf8
github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdserver.(*raftNode).start.func1(0xc4200a6498)
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdserver/raft.go:153 +0x1b3
created by github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdserver.(*raftNode).start
	/home/gyuho/go/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/etcdserver/raft.go:246 +0x1da
```

`etcdmain/etcd.go:397` is `<-s.ReadyNotify()` call inside `startEtcd`, which receives from
`EtcdServer.readych` when the server is ready to serve client requests. And `EtcdServer.publish`
is the method that closes this channel, but it never happened. Which was why it was returning
`publish error: etcdserver: request timed out`.

Another goroutine was `raft.(*node).Tick(0xc4230b7040)` that was supposed to periodically send
ticks to `node.tickc`, so that it can send heartbeats to other nodes. `etcdserver/raft.go:153` is
`raftNode.Tick` calling this `Tick` method. This goroutine was still running `select` statement,
which means it was blocking to send to `n.tickc`. Buffering this channel would help, but we need
to know why it was blocking.

*goroutine A* of `raft.Tick()` in `etcdserver.raftNode.start` periodically ticks *goroutine B*
in `raft.node.run` for election ticks. The *goroutine A* blocks until *goroutine B* receive from
`<-n.tickc`. *goroutine B* would receive ticks and process them. And *goroutine B* also tries to
send `Ready` to *goroutine A* when possible. However, if *goroutine B* takes too long to prepare
`Ready`, *goroutine A* will be blocked waiting for *goroutine B* to process its tick
(in this case, *goroutine B* had about 300,000 entries to prepare). Since *goroutine A* is being
blocked, even when `Ready` is ready, *goroutine B* cannot send out `Ready`, and drops the
prepared `Ready` to `select` `<n.tick`. Then live-lock begins.

###### Action

- Resolved via https://github.com/coreos/etcd/pull/5692

[↑ top](#debug-etcd)
<br><br><br><br><hr>










#### Intensive writes can trigger snapshot cycle

TODO

When etcd is overloaded with compacting too many entries
or rebuilding millions key indexes, the node could fall behind the leader.
Then the leader sends snapshots to them, and if those operations haven't finished yet,
etcd stops the job, and apply the latest snapshots from the leader.
This can repeat with large workloads.

###### Problem

- `2016-06-10 17:37:55 (UTC)` in functional-tester cluster.
- Compaction operation didn't finish in time,
- or recovering an etcd node takes more than 30 seconds, so test timed out.

```
2016-06-10 17:37:33.685390 I | mvcc: store.index: compact 22577950
2016-06-10 17:37:34.973993 W | wal: sync duration of 1.080456913s, expected less than 1s
2016-06-10 17:37:34.984945 I | rafthttp: receiving database snapshot [index:22605585, from ced23453f7d59148]
2016-06-10 17:37:36.223940 I | snap: saved database snapshot to disk [total bytes: 224522240]
2016-06-10 17:37:36.224400 I | etcdserver: applying snapshot at index 22590138…
2016-06-10 17:37:36.228197 I | etcdserver: raft applied incoming snapshot at index 22605585
2016-06-10 17:37:36.246313 I | etcdserver: restoring mvcc store…
#
# Expected
#
#   etcdserver: finished restoring mvcc store
#
# but this didn’t happen because it timed out from tester
#
```

###### Investigation

- Reported at https://github.com/coreos/etcd/issues/5317
	- https://github.com/coreos/etcd/issues/5440
	- https://github.com/coreos/etcd/issues/5606
- Added more logging to find detailed workloads.
	- Client writes were over 15,000 entries per second.
	- Compacting 1 ~ 3 million keys, expected take 20 ~ 40 seconds.
	- Restoring in-memory key index from disk took more than 30 seconds.
		- Did separate benchmark for this code path,
		- It indeed takes 30 seconds to rebuild 8 million keys.
- `snap: saved database snapshot to disk` indicates that there was incoming snapshot from leader while
	- etcd was compacting
	- etcd was restoring key index from disk
- When there is snapshot from leader, etcd stops restoring/compaction operation and start over the restoring based on the new snapshot
- Snapshot cycle repeated until test time-out.
- There was nothing wrong about etcd correctness. **It's more of a performance issue.**
	- **Since it's an extreme use case, we mark it as unplanned for now (June 21st, 2016).**

Here is another example:

```
2016-06-16 22:23:33.547385 I | etcd-tester: [round#19 case#10] succeed!
2016-06-16 22:23:33.547403 I | etcd-tester: [round#19] compacting 6110098 entries (timeout 2m12s)
2016-06-16 22:23:33.547433 I | etcd-tester: [round#19] compacting storage (current revision 41553384, compact revision 41543384)
2016-06-16 22:23:33.547467 I | etcd-tester: [compact kv #0] starting (endpoint 10.240.0.13:2379)
2016-06-16 22:25:05.976010 I | etcd-tester: [compact kv #0] done (endpoint 10.240.0.13:2379)
2016-06-16 22:25:05.976105 I | etcd-tester: [compact kv #1] starting (endpoint 10.240.0.14:2379)
2016-06-16 22:25:08.116716 I | etcd-tester: [compact kv #1] already compacted (endpoint 10.240.0.14:2379)
2016-06-16 22:25:08.116758 I | etcd-tester: [compact kv #1] done (endpoint 10.240.0.14:2379)
2016-06-16 22:25:08.116803 I | etcd-tester: [compact kv #2] starting (endpoint 10.240.0.15:2379)
2016-06-16 22:25:08.239065 I | etcd-tester: [compact kv #2] already compacted (endpoint 10.240.0.15:2379)
2016-06-16 22:25:08.239108 I | etcd-tester: [compact kv #2] done (endpoint 10.240.0.15:2379)
2016-06-16 22:25:08.239120 I | etcd-tester: [round#19] compacted storage (compact revision 41543384)
2016-06-16 22:25:08.239128 I | etcd-tester: [round#19] checking compaction (compact revision 41543384)
2016-06-16 22:25:08.418539 I | etcd-tester: [round#19] confirmed compaction (compact revision 41543384)
2016-06-16 22:25:08.548886 I | etcd-tester: [round#20 case#0] injecting failure "kill all members"
....

2016-06-16 22:32:11.873091 I | etcd-tester: [round#20 case#10] recovering failure "slow down all members' network"
2016-06-16 22:32:19.472731 W | etcd-tester: #0 setHealthKey error (rpc error: code = 4 desc = context deadline exceeded (10.240.0.15:2379))
...
2016-06-16 22:34:19.065329 W | etcd-tester: #59 setHealthKey error (rpc error: code = 4 desc = context deadline exceeded (10.240.0.15:2379))
2016-06-16 22:34:20.065500 I | etcd-tester: [round#20 case#10] recovery error: rpc error: code = 4 desc = context deadline exceeded (10.240.0.15:2379)
2016-06-16 22:34:20.065570 I | etcd-tester: [round#20 case#10] cleaning up...
2016-06-16 22:34:20.066768 I | etcd-agent: cleaning up "10.240.0.13:9027"
```

So compacting 6,110,098 entries was taking about 1 minute 30 seconds:

```
2016-06-16 22:23:33.547403 I | etcd-tester: [round#19] compacting 6110098 entries (timeout 2m12s)
2016-06-16 22:25:05.976010 I | etcd-tester: [compact kv #0] done (endpoint 10.240.0.13:2379)
...
2016-06-16 22:32:11.873091 I | etcd-tester: [round#20 case#10] recovering failure "slow down all members' network"
2016-06-16 22:32:19.472731 W | etcd-tester: #0 setHealthKey error (rpc error: code = 4 desc = context deadline exceeded (10.240.0.15:2379))
```

Then since then, `round #20` took 9 minutes: QPS is 15,000, estimated writes are 8 million keys.
When `setHealthKey error` was happening, the etcd node (endpoint 10.240.0.13:2379) was receiving snapshots from leader:

```
2016-06-16 22:32:17.262984 I | rafthttp: receiving database snapshot [index:47286300, from 364236831d4b55a0] ...
2016-06-16 22:32:52.075184 I | snap: saved database snapshot to disk [total bytes: 1177956352]
2016-06-16 22:32:52.075237 I | rafthttp: received and saved database snapshot [index: 47286300, from: 364236831d4b55a0] successfully
2016-06-16 22:32:52.139953 I | etcdserver: restoring mvcc store...
2016-06-16 22:32:52.140015 I | mvcc: restore compact to 41543384
2016-06-16 22:32:52.938693 I | wal: segmented wal file agent.etcd/member/wal/0000000000000073-0000000002d37700.wal is created
2016/06/16 22:32:53 grpc: Server.processUnaryRPC failed to write status: connection error: desc = "transport: write tcp 10.240.0.15:2379->10.240.0.16:52636: use of closed network connection"
2016-06-16 22:32:54.545369 I | mvcc: [DEBUG 1] rebuilding 5985459 keys
...
2016-06-16 22:33:14.492258 I | mvcc: [DEBUG 1] rebuilt 5985459 keys (restore took 17.068240835s out of 22.352217588s)
```

It received snapshot from leader, and stops node operation to restore from snapshot.
And rebuilding index on 6 million keys was taking too long (snapshot cycle).

*Then why `round #20` took 9 minutes long, so giving more time for writes?*

We have 10 failure cases per round. And `round #20` was taking so long,
because **snapshot cycle** had already been happening throughout `round #20`:

```
# [round#20 case#2] recovering failure "kill one random member"
2016-06-16 22:25:24.255488 I | mvcc: restore compact to 41543384
2016-06-16 22:25:24.758220 I | mvcc: [DEBUG 1] rebuilding 1293948 keys
2016-06-16 22:25:28.119764 I | mvcc: [DEBUG 1] rebuilt 1293948 keys (restore took 2.795265033s out of 3.864221911s)
2016-06-16 22:25:28.157051 I | rafthttp: receiving database snapshot [index:42657214, from 364236831d4b55a0] ...
2016-06-16 22:25:58.828946 I | mvcc: [DEBUG 1] rebuilding 1357222 keys
2016-06-16 22:26:02.978215 I | mvcc: [DEBUG 1] rebuilt 1357222 keys (restore took 3.548485477s out of 4.497231432s)

# [round#20 case#3] recovering failure "kill leader member"
2016-06-16 22:26:28.186779 I | mvcc: restore compact to 41543384
2016-06-16 22:26:29.282795 I | mvcc: [DEBUG 1] rebuilding 1992825 keys
2016-06-16 22:26:35.135279 I | mvcc: [DEBUG 1] rebuilt 1992825 keys (restore took 5.0375796s out of 6.948394741s)
2016-06-16 22:26:35.235815 I | rafthttp: receiving database snapshot [index:43363603, from a7dd95d8559df084] ...
2016-06-16 22:27:14.803277 I | mvcc: [DEBUG 1] rebuilding 2063471 keys
2016-06-16 22:27:22.086959 I | mvcc: [DEBUG 1] rebuilt 2063471 keys (restore took 6.240378822s out of 8.481038958s)

# [round#20 case#4] recovering failure "kill one member for long time and expect it to recover from incoming snapshot"
2016-06-16 22:27:50.204174 I | mvcc: restore compact to 41543384
2016-06-16 22:27:51.878553 I | mvcc: [DEBUG 1] rebuilding 2722256 keys
2016-06-16 22:27:59.063362 I | mvcc: [DEBUG 1] rebuilt 2722256 keys (restore took 6.050705986s out of 8.859113622s)
2016-06-16 22:27:59.163208 I | rafthttp: receiving database snapshot [index:44135065, from 8b71fb2dbf7288e3] ...
2016-06-16 22:28:32.574762 I | mvcc: [DEBUG 1] rebuilding 2834756 keys
2016-06-16 22:28:41.352297 I | mvcc: [DEBUG 1] rebuilt 2834756 keys (restore took 7.543785648s out of 10.012958026s)

# [round#20 case#5] recovering failure "kill the leader for long time and expect it to recover from incoming snapshot"
2016-06-16 22:29:08.181877 I | mvcc: restore compact to 41543384
2016-06-16 22:29:09.782590 I | mvcc: [DEBUG 1] rebuilding 3507387 keys
2016-06-16 22:29:21.606902 I | mvcc: [DEBUG 1] rebuilt 3507387 keys (restore took 10.116384674s out of 13.424910949s)
2016-06-16 22:29:48.842865 I | snap: saved database snapshot to disk [total bytes: 1177956352]
2016-06-16 22:29:50.496099 I | mvcc: [DEBUG 1] rebuilding 3717178 keys
2016-06-16 22:30:05.045239 I | mvcc: [DEBUG 1] rebuilt 3717178 keys (restore took 12.61765097s out of 16.096069541s)

# [round#20 case#8] recovering failure "slow down one member's network by adding 500 ms latency"
2016-06-16 22:31:11.872821 I | etcdserver: applying snapshot at index 45803982...
2016-06-16 22:31:13.830487 I | mvcc: [DEBUG 1] rebuilding 4550704 keys
2016-06-16 22:31:28.402413 I | mvcc: [DEBUG 1] rebuilt 4550704 keys (restore took 12.507724976s out of 16.444942476s)

# [round#20 case#10] recovering failure "slow down all members' network"
2016-06-16 22:32:52.075184 I | snap: saved database snapshot to disk [total bytes: 1177956352]
2016-06-16 22:32:54.545369 I | mvcc: [DEBUG 1] rebuilding 5985459 keys
2016-06-16 22:33:14.492258 I | mvcc: [DEBUG 1] rebuilt 5985459 keys (restore took 17.068240835s out of 22.352217588s)
```

Then why in the first place, snapshot sending is triggered?

The stresser kept writing throughout the whole iteration and even during the compaction.
So it becomes more and more easier for followers to fall behind, triggering leader to
send snapshots.


###### Action

- Ignore this failure to keep tests running via https://github.com/coreos/etcd/pull/5610
- Add rate-limit the stresser via https://github.com/coreos/etcd/pull/5887
- Pause stresser before compaction via https://github.com/coreos/etcd/pull/5943

[↑ top](#debug-etcd)
<br><br><br><br><hr>










#### Retry client requests when etcd is ready

Be aware that etcd cannot serve client requests until the leader election is done.
Sending client requests too early will get errors.

###### Problem

- `2016-06-06 23:37:33 (UTC)` in functional-tester cluster
- etcd-tester writes didn't go through, so tester failed as below:

```
2016-06-06 23:37:35.192708 I | etcd-tester: [round#0 case#4] injecting failure "kill one member for long time and expect it to recover from incoming snapshot"
2016-06-06 23:38:05.208118 I | etcd-tester: [round#0 case#4] injection error: cluster too slow: only commit 0 requests in 30s
```

###### Investigation

- Reported at https://github.com/coreos/etcd/issues/5573
- Added more logging to find why client write requests were failing
- error was `etcdserver: not capable` and happened only at the beginning of cluster set-up
- Which means that the etcd-tester clients were hitting etcd before the cluster is ready to serve client requests
- Fixed the stress-er code to match the exact error and make it retry

###### Action

- Resolved via https://github.com/coreos/etcd/pull/5587

[↑ top](#debug-etcd)
<br><br><br><br>










#### Message is delivered only one way

TODO

###### Problem

https://github.com/coreos/etcd/issues/4855

###### Investigation

###### Action

- Resolved via https://github.com/coreos/etcd/pull/4888

[↑ top](#debug-etcd)
<br><br><br><br>
