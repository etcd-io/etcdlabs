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
