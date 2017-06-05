// Copyright 2017 CoreOS, Inc.
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

package recordpb

import "strings"

// TrimFailpoint trims failpoint string.
func TrimFailpoint(s string) string {
	if strings.HasPrefix(s, "failpoint github.com/coreos/etcd/") {
		s = strings.Replace(s, "github.com/coreos/etcd/", "", 1)
	}
	return strings.TrimSpace(s)
}
