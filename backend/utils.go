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
	"fmt"
	"math/rand"
	"time"
)

const (
	letterBytes   = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	letterIdxBits = 6                    // 6 bits to represent a letter index
	letterIdxMask = 1<<letterIdxBits - 1 // All 1-bits, as many as letterIdxBits
	letterIdxMax  = 63 / letterIdxBits   // # of letter indices fitting in 63 bits
)

func randBytes(bytesN int) []byte {
	src := rand.NewSource(time.Now().UnixNano())
	b := make([]byte, bytesN)
	for i, cache, remain := bytesN-1, src.Int63(), letterIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = src.Int63(), letterIdxMax
		}
		if idx := int(cache & letterIdxMask); idx < len(letterBytes) {
			b[i] = letterBytes[idx]
			i--
		}
		cache >>= letterIdxBits
		remain--
	}
	return b
}

func multiRandStrings(bytesN, sliceN int, prefix string) []string {
	m := make(map[string]struct{})
	rs := make([]string, 0, sliceN)
	for len(rs) != sliceN {
		b := randBytes(bytesN)
		s := fmt.Sprintf("%s%s%d", prefix, b, len(rs)+1)
		if _, ok := m[s]; !ok {
			rs = append(rs, s)
			m[s] = struct{}{}
		}
	}
	return rs
}

func multiRandKeyValues(keyPrefix, valPrefix string, bytesN, sliceN int) []KeyValue {
	keys, vals := multiRandStrings(bytesN, sliceN, keyPrefix), multiRandStrings(bytesN, sliceN, valPrefix)
	kvs := make([]KeyValue, sliceN)
	for i := range kvs {
		kvs[i].Key = keys[i]
		kvs[i].Value = vals[i]
	}
	return kvs
}

func roundDownDuration(d, scale time.Duration) time.Duration {
	d /= scale // round down in scale
	d *= scale
	return d
}
