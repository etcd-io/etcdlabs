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

package cluster

import (
	"io/ioutil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

func existFileOrDir(name string) bool {
	_, err := os.Stat(name)
	return err == nil
}

const (
	// privateFileMode grants owner to read/write a file.
	privateFileMode = 0600

	// privateDirMode grants owner to make/remove files inside the directory.
	privateDirMode = 0700
)

func dirWritable(dir string) error {
	f := filepath.Join(dir, ".touch")
	if err := ioutil.WriteFile(f, []byte(""), privateFileMode); err != nil {
		return err
	}
	return os.Remove(f)
}

func mkdirAll(dir string) error {
	err := os.MkdirAll(dir, privateDirMode)
	if err != nil {
		return err
	}
	return dirWritable(dir)
}

func getHost(ep string) string {
	url, uerr := url.Parse(ep)
	if uerr != nil || !strings.Contains(ep, "://") {
		return ep
	}
	return url.Host
}
