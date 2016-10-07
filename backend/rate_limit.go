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
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var (
	defaultRequestInterval = 2 * time.Second

	globalRequestLimiter = &requestLimiter{
		lastRequest: time.Time{},

		interval: defaultRequestInterval,
		minScale: time.Millisecond,

		ctx: nil,

		// allow only 1 request for every defaultRequestInterval
		limiter: rate.NewLimiter(rate.Every(defaultRequestInterval), 1),
	}
)

type requestLimiter struct {
	mu          sync.RWMutex
	lastRequest time.Time

	interval time.Duration
	minScale time.Duration

	ctx context.Context

	limiter *rate.Limiter
}

func (rl *requestLimiter) check() (msg string, ok bool) {
	subctx, subcancel := context.WithCancel(rl.ctx) // to signal goroutine exit
	canceled, wc := false, make(chan struct{})
	go func(ctx context.Context) {
		err := rl.limiter.Wait(ctx)
		canceled = err == context.Canceled
		close(wc)
	}(subctx)

	select {
	case <-rl.ctx.Done():
		subcancel() // stop waiting on rate limiter

		msg = context.Canceled.Error()
		ok = false

	case <-wc: // ok to request
		if canceled {
			msg = context.Canceled.Error()
			ok = false
			break
		}
		msg = "ok to request"
		ok = true

	case <-time.After(10 * time.Millisecond): // wait up to 10ms; blocked because of rate limit
		subcancel() // stop waiting on rate limiter

		rl.mu.RLock()
		took := time.Since(rl.lastRequest)
		rl.mu.RUnlock()

		left := rl.interval - took
		left = roundDownDuration(left, rl.minScale)

		msg = fmt.Sprintf("rate limit exceeded (try again after %v)", left)
		ok = false
	}

	subcancel()
	return
}

func (rl *requestLimiter) advance() {
	rl.mu.Lock()
	rl.lastRequest = time.Now()
	rl.mu.Unlock()
}
