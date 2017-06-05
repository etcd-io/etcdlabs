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

package ratelimit

import (
	"context"
	"testing"
	"time"

	"github.com/golang/glog"
)

func TestRequestLimiter(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	rl := NewRequestLimiter(ctx, time.Second)

	// first request must be OK
	msg, ok := rl.Check()
	if msg != OkMessage || !ok {
		t.Fatalf("expected ok, got %q (%v)", msg, ok)
	}
	rl.Advance()
	glog.Info("1:", msg)

	// request right after first request must exceed rate-limit
	msg, ok = rl.Check()
	if msg == OkMessage || ok {
		t.Fatalf("expected rate-limit-excess, got %q (%v)", msg, ok)
	}
	rl.Advance()
	glog.Info("2:", msg)

	// request after waiting rate-limit duration must be OK
	time.Sleep(time.Second)
	msg, ok = rl.Check()
	if msg != OkMessage || !ok {
		t.Fatalf("expected ok, got %q (%v)", msg, ok)
	}
	rl.Advance()
	glog.Info("3:", msg)

	// cancel the root context must return 'root context canceled'
	cancel()

	msg, ok = rl.Check()
	if msg != RootContextCanceled || ok {
		t.Fatalf("expected 'context canceled', got %q (%v)", msg, ok)
	}
	rl.Advance()
	glog.Info("4:", msg)
}
