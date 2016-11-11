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
	"encoding/json"
	"net/http"
	"time"

	"github.com/coreos/etcdlabs/pkg/ratelimit"
	humanize "github.com/dustin/go-humanize"
)

var (
	// limit for manual fetch
	fetchMetricsRequestIntervalLimit = 10 * time.Second
	fetchMetricsLimiter              ratelimit.RequestLimiter
)

// TesterStatus wraps metrics.TesterStatus.
type TesterStatus struct {
	Name          string
	TotalCase     int64
	CurrentCase   int64
	CurrentFailed int64
}

// MetricsResponse translates client's GET response in frontend-friendly format.
type MetricsResponse struct {
	Success    bool
	Result     string
	LastUpdate string
	Statuses   []TesterStatus
}

// fetchMetricsRequestHandler handles fetch metrics requests.
func fetchMetricsRequestHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		mresp := MetricsResponse{Success: true}
		if rmsg, ok := fetchMetricsLimiter.Check(); !ok {
			mresp.Success = false
			mresp.Result = "fetch metrics request " + rmsg
			mresp.LastUpdate = humanize.Time(globalMetrics.GetLastUpdate())
			return json.NewEncoder(w).Encode(mresp)
		}
		fetchMetricsLimiter.Advance()

		if globalMetrics == nil {
			mresp.Success = false
			mresp.Result = "metrics is disabled"
			return json.NewEncoder(w).Encode(mresp)
		}

		if err := globalMetrics.Sync(); err != nil {
			mresp.Success = false
			mresp.Result = "fetch metrics request " + err.Error()
			mresp.LastUpdate = humanize.Time(globalMetrics.GetLastUpdate())
			return json.NewEncoder(w).Encode(mresp)
		}

		for _, status := range globalMetrics.Get() {
			mresp.Success = true
			mresp.Statuses = append(mresp.Statuses, TesterStatus{
				Name:          status.Name,
				TotalCase:     status.TotalCase,
				CurrentCase:   status.CurrentCase,
				CurrentFailed: status.CurrentFailed,
			})
			mresp.LastUpdate = humanize.Time(globalMetrics.GetLastUpdate())
		}
		return json.NewEncoder(w).Encode(mresp)

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
