package clusterpb

const (
	// StoppedMemberStatus is node status before start or after stop.
	StoppedMemberStatus = "Stopped"
	// FollowerMemberStatus is follower in Raft.
	FollowerMemberStatus = "Follower"
	// LeaderMemberStatus is leader in Raft.
	LeaderMemberStatus = "Leader"
)
