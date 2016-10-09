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
	"fmt"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// NewRequestLimiter returns a new RequestLimiter.
func NewRequestLimiter(rootCtx context.Context, interval time.Duration) RequestLimiter {
	return &requestLimiter{
		rootCtx:     rootCtx,
		lastRequest: time.Time{},

		interval: interval,
		minScale: time.Millisecond,

		// allow only 1 request for every interval
		limiter: rate.NewLimiter(rate.Every(interval), 1),
	}
}

// RequestLimiter limits requests.
type RequestLimiter interface {
	// Check returns true if it's ok to request.
	Check() (msg string, ok bool)
	// Advance must be called after Check.
	Advance()
	// SetInterval updates the interval.
	SetInterval(interval time.Duration)
}

type requestLimiter struct {
	mu      sync.RWMutex
	rootCtx context.Context

	interval time.Duration
	minScale time.Duration

	limiter     *rate.Limiter
	lastRequest time.Time
}

// OkMessage is the message returned when it's ok to request.
const OkMessage = "OK"

var (
	canceledMsg = context.Canceled.Error()

	// RootContextCanceled is returned when the parent context was canceled.
	RootContextCanceled = "root " + canceledMsg
)

func (rl *requestLimiter) Check() (msg string, ok bool) {
	subctx, subcancel := context.WithCancel(rl.rootCtx) // to signal goroutine exit

	canceled := false
	wc := make(chan struct{})

	go func(ctx context.Context) {
		rl.mu.Lock()
		limiter := rl.limiter
		rl.mu.Unlock()

		err := limiter.Wait(ctx)

		canceled = err == context.Canceled
		close(wc)
	}(subctx)

	select {
	case <-rl.rootCtx.Done(): // root context is canceled
		subcancel() // stop rate limiter waiting(blocking)

		<-wc // wait for rate limiter goroutine to return

		msg = "root " + context.Canceled.Error()
		ok = false

	case <-wc: // ok to request
		if canceled {
			msg = context.Canceled.Error()
			ok = false
			break
		}
		msg = OkMessage
		ok = true

	case <-time.After(5 * time.Millisecond): // wait up to 5ms; rate limiter is blocking, so it returns message, false
		subcancel() // stop waiting on rate limiter

		rl.mu.RLock()
		took := time.Since(rl.lastRequest)
		rl.mu.RUnlock()

		msg = fmt.Sprintf("rate limit exceeded (try again after %v)", roundDownDuration(rl.interval-took, rl.minScale))
		ok = false
	}

	subcancel()
	return
}

func (rl *requestLimiter) Advance() {
	rl.mu.Lock()
	rl.lastRequest = time.Now()
	rl.mu.Unlock()
}

func (rl *requestLimiter) SetInterval(interval time.Duration) {
	rl.mu.Lock()
	rl.limiter.SetLimit(rate.Every(interval))
	rl.interval = interval
	rl.mu.Unlock()
}
