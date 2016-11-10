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
	// Ping pings database and metrics endpoint.
	Ping()

	// Sync updates tester status data in backend database.
	Sync() error

	// Get queries all historical data from database.
	Get() TesterStatus
}

type defaultMetrics struct {
	name            string
	metricsEndpoint string

	dbHost     string
	dbPort     int
	dbUser     string
	dbPassword string

	mu            sync.Mutex
	currentStatus *TesterStatus
}

// New returns a new default metrics.
func New(name, ep, dbHost string, dbPort int, dbUser, dbPassword string) Metrics {
	return &defaultMetrics{
		name:            name,
		metricsEndpoint: ep,

		dbHost:     dbHost,
		dbPort:     dbPort, // 3306 is default MySQL port
		dbUser:     dbUser,
		dbPassword: dbPassword,

		currentStatus: &TesterStatus{},
	}
}

func (m *defaultMetrics) Ping() {
	caseN, failedN, err := fetch(m.metricsEndpoint)
	if err != nil {
		plog.Warning("fetch error:", err)
		return
	}
	println()
	fmt.Println(`
#######################
# ping metrics result #
#######################
`)
	fmt.Println("current case:", caseN)
	fmt.Println("current failed case:", failedN)
	println()

	fmt.Println(`
########################
# ping database result #
########################
`)
	db, err := m.mysql()
	if err != nil {
		plog.Warning("mysql error:", err)
		return
	}
	defer db.Close()

	rows, err := db.Query(`SELECT name, total_case, total_failed, current_case, current_failed, last_update FROM etcdlabs.metrics`)
	if err != nil {
		plog.Warning("db.Query error:", err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var name []byte
		var totalCase []byte
		var totalFailed []byte
		var currentCase []byte
		var currentFailed []byte
		var lastUpdate []byte
		if err := rows.Scan(&name, &totalCase, &totalFailed, &currentCase, &currentFailed, &lastUpdate); err != nil {
			plog.Warning("rows.Scan error:", err)
			return
		}
		fmt.Printf(`-----
name           %q
total case     %q
total failed   %q
current case   %q
current failed %q
last update    %q
-----
`,
			string(name), string(totalCase), string(totalFailed), string(currentCase), string(currentFailed), string(lastUpdate))
		println()
	}
	if err := rows.Err(); err != nil {
		plog.Warning("rows.Err error:", err)
		return
	}
}

func (m *defaultMetrics) Get() TesterStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	return *m.currentStatus
}

func (m *defaultMetrics) Sync() error {
	plog.Printf("Sync started on %q %q", m.name, m.metricsEndpoint)

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
		plog.Printf("Sync querying current case and failed on %q %q", m.name, m.metricsEndpoint)
		rows, rerr := db.Query(fmt.Sprintf(`SELECT total_case, total_failed, current_case, current_failed FROM etcdlabs.metrics WHERE name = "%s"`, m.name))
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

	plog.Printf("Sync fetching current case and failed on %q %q", m.name, m.metricsEndpoint)
	caseN, failedN, err := fetch(m.metricsEndpoint)
	if err != nil {
		return err
	}

	toUpdate := false
	if int64(caseN) != m.currentStatus.CurrentCase {
		delta := int64(caseN) - m.currentStatus.CurrentCase
		if delta < 0 { // tester redeployed
			delta = int64(caseN)
		}
		m.currentStatus.TotalCase += delta
		m.currentStatus.CurrentCase = int64(caseN)
		toUpdate = true
	}

	if int64(failedN) != m.currentStatus.CurrentFailed {
		delta := int64(failedN) - m.currentStatus.CurrentFailed
		if delta < 0 { // tester redeployed
			delta = int64(failedN)
		}
		m.currentStatus.TotalFailed += delta
		m.currentStatus.CurrentFailed = int64(failedN)
		toUpdate = true
	}

	if toUpdate {
		now := time.Now()
		plog.Printf("Sync updating metrics table on %q %q", m.name, m.metricsEndpoint)
		qry := fmt.Sprintf(`UPDATE etcdlabs.metrics
SET total_case = %d, total_failed = %d, current_case = %d, current_failed = %d, last_update = %q
WHERE name = %q`, m.currentStatus.TotalCase,
			m.currentStatus.TotalFailed,
			m.currentStatus.CurrentCase,
			m.currentStatus.CurrentFailed,
			now.String()[:19],
			m.name,
		)
		if _, err := db.Query(qry); err != nil {
			return fmt.Errorf("error %v when running query %q", err, qry)
		}

		m.currentStatus.LastUpdate = now
		plog.Printf("Sync success on %q %q", m.name, m.metricsEndpoint)
	}

	plog.Printf("Sync success on %q %q", m.name, m.metricsEndpoint)
	return nil
}

func (m *defaultMetrics) mysql() (db *sql.DB, err error) {
	db, err = sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%d)/etcdlabs?timeout=2s", m.dbUser, m.dbPassword, m.dbHost, m.dbPort))
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

func toInclude(s string) bool {
	return strings.HasPrefix(s, "etcd_funcational_tester_")
}
