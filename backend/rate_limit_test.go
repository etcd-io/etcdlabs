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

package backend

import (
	"context"
	"fmt"
	"testing"
	"time"

	"golang.org/x/time/rate"
)

func Test_requestLimiter(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	rl := &requestLimiter{
		lastRequest: time.Time{},

		interval: time.Second,
		minScale: time.Millisecond,

		ctx: ctx,

		limiter: rate.NewLimiter(rate.Every(time.Second), 1),
	}

	msg, ok := rl.check()
	if msg != "ok to request" || !ok {
		t.Fatalf("expected ok, got %q (%v)", msg, ok)
	}
	rl.advance()

	msg, ok = rl.check()
	if msg == "ok to request" || ok {
		t.Fatalf("expected rate-limit-excess, got %q (%v)", msg, ok)
	}
	rl.advance()
	fmt.Println(msg)

	time.Sleep(time.Second)

	msg, ok = rl.check()
	if msg != "ok to request" || !ok {
		t.Fatalf("expected ok, got %q (%v)", msg, ok)
	}
	rl.advance()

	time.Sleep(time.Second)
	cancel()

	msg, ok = rl.check()
	if msg != "context canceled" || ok {
		t.Fatalf("expected 'context canceled', got %q (%v)", msg, ok)
	}
	rl.advance()
}
