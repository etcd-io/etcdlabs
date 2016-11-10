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
	"bufio"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/coreos/etcd/pkg/httputil"
	"github.com/coreos/etcd/pkg/transport"

	// mysql query
	_ "github.com/go-sql-driver/mysql"
)

// TesterStatus represents etcd functional-tester metrics.
type TesterStatus struct {
	Name          string
	TotalCase     int64
	TotalFailed   int64
	CurrentCase   int64
	CurrentFailed int64
	LastUpdate    time.Time
}

// Metrics represents etcd functional-tester metrics.
type Metrics interface {
	// Sync updates tester status data in backend database.
	Sync() error

	// Get queries all historical data from database.
	Get() TesterStatus
}

// New returns a new default metrics.
func New(name, ep, dbHost string, dbUser, dbPassword string) Metrics {
	return &defaultMetrics{
		name:      name,
		metricsEp: ep,

		dbHost:     dbHost,
		dbUser:     dbUser,
		dbPassword: dbPassword,

		currentStatus: &TesterStatus{},
	}
}

type defaultMetrics struct {
	name      string
	metricsEp string

	dbHost     string
	dbUser     string
	dbPassword string

	mu            sync.Mutex
	currentStatus *TesterStatus
}

func (m *defaultMetrics) Sync() error {
	plog.Printf("Sync started on %q %q", m.name, m.metricsEp)

	m.mu.Lock()
	defer m.mu.Unlock()

	// compare current number
	db, derr := m.mysql()
	if derr != nil {
		return derr
	}
	defer db.Close()

	// fresh; fetch data to compare against
	if m.currentStatus.LastUpdate.IsZero() {
		plog.Printf("Sync querying current case and failed on %q %q", m.name, m.metricsEp)
		rows, rerr := db.Query(fmt.Sprintf(`SELECT current_case, current_failed FROM etcdlabs.metrics WHERE name = "%s"`, m.name))
		if rerr != nil {
			return rerr
		}
		defer rows.Close()

		for rows.Next() {
			var totalCaseV []byte
			var totalFailedV []byte
			var caseV []byte
			var failedV []byte
			if err := rows.Scan(&totalCaseV, &totalFailedV, &caseV, &failedV); err != nil {
				return err
			}

			totalCaseN, err := strconv.ParseInt(string(totalCaseV), 10, 32)
			if err != nil {
				return err
			}
			totalFailedN, err := strconv.ParseInt(string(totalFailedV), 10, 32)
			if err != nil {
				return err
			}
			caseN, err := strconv.ParseInt(string(caseV), 10, 32)
			if err != nil {
				return err
			}
			failedN, err := strconv.ParseInt(string(failedV), 10, 32)
			if err != nil {
				return err
			}

			m.currentStatus.TotalCase = totalCaseN
			m.currentStatus.TotalFailed = totalFailedN
			m.currentStatus.CurrentCase = caseN
			m.currentStatus.CurrentFailed = failedN

			break
		}
		if err := rows.Err(); err != nil {
			return err
		}
	}

	plog.Printf("Sync fetching current case and failed on %q %q", m.name, m.metricsEp)
	caseN, failedN, err := fetch(m.metricsEp)
	if err != nil {
		return err
	}

	toUpdate := false
	ns := *m.currentStatus
	if int64(caseN) > m.currentStatus.CurrentCase {
		delta := int64(caseN) - m.currentStatus.CurrentCase
		ns.TotalCase += delta
		ns.CurrentCase = int64(caseN)
		ns.LastUpdate = time.Now()
		toUpdate = true
	}
	if int64(failedN) > m.currentStatus.CurrentFailed {
		delta := int64(failedN) - m.currentStatus.CurrentFailed
		ns.TotalFailed += delta
		ns.CurrentFailed = int64(failedN)
		ns.LastUpdate = time.Now()
		toUpdate = true
	}
	if toUpdate {
		plog.Printf("Sync updating metrics table on %q %q", m.name, m.metricsEp)
		if _, err := db.Query(fmt.Sprintf(`UPDATE etcdlabs.metrics SET total_case = %d, total_failed = %d, current_case = %d, current_failed = %d WHERE name = "%s"`,
			ns.TotalCase, ns.TotalFailed, ns.CurrentCase, ns.CurrentFailed, m.name)); err != nil {
			return err
		}
	}

	m.currentStatus = &ns
	plog.Printf("Sync success on %q %q", m.name, m.metricsEp)
	return nil
}

func (m *defaultMetrics) mysql() (db *sql.DB, err error) {
	db, err = sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:3306)/etcdlabs?timeout=2s", m.dbUser, m.dbPassword, m.dbHost))
	return
}

// fetch fetches current etcd functional-tester metrics.
func fetch(ep string) (curCase int, curFailed int, err error) {
	cfgtls := transport.TLSInfo{}
	tr, err := transport.NewTransport(cfgtls, time.Second)
	if err != nil {
		return 0, 0, err
	}

	tr.MaxIdleConns = -1
	tr.DisableKeepAlives = true

	cli := &http.Client{Transport: tr}

	resp, rerr := cli.Get(ep)
	if rerr != nil {
		return 0, 0, rerr
	}
	defer httputil.GracefulClose(resp)

	rd := bufio.NewReader(resp.Body)
	mm := make(map[string]int)
	for {
		line, err := rd.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return 0, 0, err
		}
		line = strings.TrimSpace(line)
		if toInclude(line) {
			idx := strings.LastIndex(line, " ")
			n1 := line[:idx]
			n2 := line[idx+1:]
			num, err := strconv.ParseInt(n2, 10, 32)
			if err != nil {
				return 0, 0, err
			}
			mm[n1] = int(num)
		}
	}

	for k, v := range mm {
		if strings.HasPrefix(k, "etcd_funcational_tester_case_total") {
			curCase += v
			continue
		}
		if strings.HasPrefix(k, "etcd_funcational_tester_case_failed_total") {
			curFailed += v
		}
	}
	return
}

func (m *defaultMetrics) Get() TesterStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	return *m.currentStatus
}

func toInclude(s string) bool {
	return strings.HasPrefix(s, "etcd_funcational_tester_")
}
