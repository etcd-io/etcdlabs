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
	"errors"
	"net/http"
	"time"

	"github.com/coreos/etcdlabs/pkg/metrics"
	"github.com/coreos/etcdlabs/pkg/ratelimit"
	humanize "github.com/dustin/go-humanize"
)

var (
	// MinFetchMetricsInterval is the minimum interval to fetch metrics.
	MinFetchMetricsInterval = time.Hour

	// limit for manual fetch
	fetchMetricsRequestIntervalLimit = 10 * time.Second
	fetchMetricsLimiter              ratelimit.RequestLimiter
)

func runFetchMetrics(itv time.Duration, mts ...metrics.Metrics) {
	if len(mts) == 0 {
		return
	}

	for {
		if err := fetchMetrics(mts...); err != nil {
			plog.Warning(err)
		}

		if itv < time.Duration(1) {
			plog.Warning("sync done!")
			break
		}

		plog.Warning("sleeping", itv)
		time.Sleep(itv)
	}
}

func fetchMetrics(mts ...metrics.Metrics) error {
	if len(mts) == 0 {
		return nil
	}

	if rmsg, ok := fetchMetricsLimiter.Check(); !ok {
		return errors.New(rmsg)
	}
	fetchMetricsLimiter.Advance()

	var errs []error
	for _, mt := range mts {
		if err := mt.Sync(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) == 0 {
		return nil
	}

	errt := ""
	for i, err := range errs {
		if i != 0 {
			errt += ";"
		}
		errt += err.Error()
	}
	return errors.New(errt)
}

// MetricsResponse translates client's GET response in frontend-friendly format.
type MetricsResponse struct {
	Success    bool
	Result     string
	LastUpdate string
	Statuses   []TesterStatus
}

// TesterStatus wraps metrics.TesterStatus.
type TesterStatus struct {
	Name          string
	TotalCase     int64
	CurrentCase   int64
	CurrentFailed int64
}

// fetchMetricsRequestHandler handles fetch metrics requests.
func fetchMetricsRequestHandler(ctx context.Context, w http.ResponseWriter, req *http.Request) error {
	switch req.Method {
	case "GET":
		mresp := MetricsResponse{Success: true}
		if err := fetchMetrics(globalMetrics...); err != nil {
			mresp.Success = false
			mresp.Result = "fetch metrics request " + err.Error()
			return json.NewEncoder(w).Encode(mresp)
		}
		for _, mt := range globalMetrics {
			st := mt.Get()
			mresp.Statuses = append(mresp.Statuses, TesterStatus{
				Name:          st.Name,
				TotalCase:     st.TotalCase,
				CurrentCase:   st.CurrentCase,
				CurrentFailed: st.CurrentFailed,
			})
			mresp.LastUpdate = humanize.Time(st.LastUpdate)
		}
		return json.NewEncoder(w).Encode(mresp)

	default:
		http.Error(w, "Method Not Allowed", 405)
	}

	return nil
}
