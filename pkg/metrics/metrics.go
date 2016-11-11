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
	"sort"
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
	Name            string
	MetricsEndpoint string
	TotalCase       int64
	TotalFailed     int64
	CurrentCase     int64
	CurrentFailed   int64
}

// Metrics represents etcd functional-tester metrics.
type Metrics interface {
	// Ping pings database and metrics endpoint.
	Ping() error

	// Sync updates tester status data in backend database.
	Sync() error

	// Get returns all current tester statuses.
	Get() []TesterStatus
}

type defaultMetrics struct {
	dbHost     string
	dbPort     int
	dbUser     string
	dbPassword string

	mu            sync.Mutex
	currentStatus map[string]*TesterStatus
}

// New returns a new default metrics.
func New(dbHost string, dbPort int, dbUser string, dbPassword string, statuses map[string]*TesterStatus) Metrics {
	return &defaultMetrics{
		dbHost:        dbHost,
		dbPort:        dbPort, // 3306 is default MySQL port
		dbUser:        dbUser,
		dbPassword:    dbPassword,
		currentStatus: statuses,
	}
}

func fetchTester(ep string) (curCase int64, curFailed int64, err error) {
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
	mm := make(map[string]int64)
	for {
		line, err := rd.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return 0, 0, err
		}
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "etcd_funcational_tester_") {
			idx := strings.LastIndex(line, " ")
			n1 := line[:idx]
			n2 := line[idx+1:]
			num, err := strconv.ParseInt(n2, 10, 32)
			if err != nil {
				return 0, 0, err
			}
			mm[n1] = num
		}
	}

	for k, v := range mm {
		if v == 0 {
			continue
		}
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

type metricsRow struct {
	name          []byte
	totalCase     []byte
	totalFailed   []byte
	currentCase   []byte
	currentFailed []byte
	lastUpdate    []byte
}

const metricsQuery = `SELECT name,
total_case,
total_failed,
current_case,
current_failed,
last_update
FROM etcdlabs.metrics
ORDER BY 1`

func (m *defaultMetrics) mysql() (db *sql.DB, err error) {
	db, err = sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%d)/etcdlabs?timeout=2s", m.dbUser, m.dbPassword, m.dbHost, m.dbPort))
	return
}

func (m *defaultMetrics) fetchDB() (mtrs []metricsRow, err error) {
	db, err := m.mysql()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	plog.Println("fetchDB starts")
	rows, err := db.Query(metricsQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		row := metricsRow{}
		if err := rows.Scan(&row.name, &row.totalCase, &row.totalFailed, &row.currentCase, &row.currentFailed, &row.lastUpdate); err != nil {
			return nil, err
		}
		mtrs = append(mtrs, row)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return
}

func (m *defaultMetrics) Ping() error {
	fmt.Println(`
###############
# ping result #
###############
`)
	rows, err := m.fetchDB()
	if err != nil {
		return err
	}
	for _, row := range rows {
		status, ok := m.currentStatus[string(row.name)]
		if !ok {
			return fmt.Errorf("unknown name %q", string(row.name))
		}
		caseN, failedN, err := fetchTester(status.MetricsEndpoint)
		if err != nil {
			return err
		}

		fmt.Printf(`-----
name           %q

total case     %q
total failed   %q

current case   %q (tester %d)
current failed %q (tester %d)

last update    %q
-----

`,
			string(row.name),
			string(row.totalCase),
			string(row.totalFailed),
			string(row.currentCase),
			caseN,
			string(row.currentFailed),
			failedN,
			string(row.lastUpdate),
		)
	}
	return nil
}

func (m *defaultMetrics) Sync() error {
	plog.Println("Sync starts")

	m.mu.Lock()
	defer m.mu.Unlock()

	rows, err := m.fetchDB()
	if err != nil {
		return err
	}

	for _, row := range rows {
		name := string(row.name)
		status, ok := m.currentStatus[name]
		if !ok {
			return fmt.Errorf("unknown name %q", name)
		}

		totalCaseDB, err := strconv.ParseInt(string(row.totalCase), 10, 32)
		if err != nil {
			return err
		}
		totalFailedDB, err := strconv.ParseInt(string(row.totalFailed), 10, 32)
		if err != nil {
			return err
		}
		currentCaseDB, err := strconv.ParseInt(string(row.currentCase), 10, 32)
		if err != nil {
			return err
		}
		currentFailedDB, err := strconv.ParseInt(string(row.currentFailed), 10, 32)
		if err != nil {
			return err
		}

		// first run
		if status.TotalCase == 0 && totalCaseDB != 0 {
			status.TotalCase = totalCaseDB
		}
		if status.TotalFailed == 0 && totalFailedDB != 0 {
			status.TotalFailed = totalFailedDB
		}
		if status.CurrentCase == 0 && currentCaseDB != 0 {
			status.CurrentCase = currentCaseDB
		}
		if status.CurrentFailed == 0 && currentFailedDB != 0 {
			status.CurrentFailed = currentFailedDB
		}

		caseNew, failedNew, err := fetchTester(status.MetricsEndpoint)
		if err != nil {
			return err
		}

		needUpdate := currentCaseDB != caseNew || currentFailedDB != failedNew

		if currentCaseDB != caseNew {
			delta := currentCaseDB - caseNew
			status.CurrentCase = caseNew
			if delta < 0 { // tester redeployed
				delta = caseNew
			}
			status.TotalCase += delta
		}
		if currentFailedDB != failedNew {
			delta := currentFailedDB - failedNew
			status.CurrentFailed = failedNew
			if delta < 0 { // tester redeployed
				delta = failedNew
			}
			status.TotalFailed += delta
		}

		if needUpdate {
			now := time.Now()
			plog.Printf("Sync updating metrics table on %q %q", name, status.MetricsEndpoint)
			qry := fmt.Sprintf(`UPDATE etcdlabs.metrics
SET total_case = %d, total_failed = %d, current_case = %d, current_failed = %d, last_update = %q
WHERE name = %q`, status.TotalCase,
				status.TotalFailed,
				status.CurrentCase,
				status.CurrentFailed,
				now.String()[:19],
				name,
			)

			db, err := m.mysql()
			if err != nil {
				return err
			}
			defer db.Close()
			if _, err := db.Query(qry); err != nil {
				return err
			}
		}
	}

	plog.Println("Sync success")
	return nil
}

type byName []TesterStatus

func (s byName) Len() int           { return len(s) }
func (s byName) Swap(i, j int)      { s[i], s[j] = s[j], s[i] }
func (s byName) Less(i, j int) bool { return s[i].Name < s[j].Name }

func (m *defaultMetrics) Get() []TesterStatus {
	ts := make([]TesterStatus, 0, len(m.currentStatus))
	m.mu.Lock()
	for _, v := range m.currentStatus {
		ts = append(ts, *v)
	}
	m.mu.Unlock()

	sort.Sort(byName(ts))
	return ts
}
