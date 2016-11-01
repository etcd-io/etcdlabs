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

package listener

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"os"
	"time"
)

type listenerUnix struct {
	net.Listener
}

func (lu *listenerUnix) Close() error {
	if err := os.RemoveAll(lu.Addr().String()); err != nil {
		return err
	}
	return lu.Listener.Close()
}

// NewListenerUnix returns new net.Listener with unix socket
// (unix sockets via unix://address).
//
// (etcd pkg.transport.NewUnixListener)
func NewListenerUnix(addr string) (net.Listener, error) {
	if err := os.RemoveAll(addr); err != nil {
		return nil, err
	}
	l, err := net.Listen("unix", addr)
	if err != nil {
		return nil, err
	}
	return &listenerUnix{l}, nil
}

// NewListener returns new net.Listener based on the scheme and tls.Config.
//
// (etcd pkg.transport.NewListener)
func NewListener(scheme, addr string, tlsConfig *tls.Config) (l net.Listener, err error) {
	switch scheme {
	case "unix", "unixs":
		l, err = NewListenerUnix(addr)
		if err != nil {
			return
		}

	case "http", "https":
		l, err = net.Listen("tcp", addr)
		if err != nil {
			return
		}

	default:
		return nil, fmt.Errorf("%q is not supported", scheme)
	}

	if scheme != "https" && scheme != "unixs" { // no need TLS
		return
	}
	if tlsConfig == nil { // need TLS, but empty config
		return nil, fmt.Errorf("cannot listen on TLS for %s: KeyFile and CertFile are not presented", scheme+"://"+addr)
	}
	return tls.NewListener(l, tlsConfig), nil
}

type listenerStoppable struct {
	net.Listener
	stopc <-chan struct{}
}

// NewListenerStoppable returns stoppable net.Listener.
func NewListenerStoppable(scheme, addr string, tlsConfig *tls.Config, stopc <-chan struct{}) (net.Listener, error) {
	ln, err := NewListener(scheme, addr, tlsConfig)
	if err != nil {
		return nil, err
	}
	ls := &listenerStoppable{
		Listener: ln,
		stopc:    stopc,
	}
	return ls, nil
}

// ErrListenerStopped is returned when the listener is stopped.
var ErrListenerStopped = errors.New("listener stopped")

func (ln *listenerStoppable) Accept() (net.Conn, error) {
	connc, errc := make(chan net.Conn, 1), make(chan error)
	go func() {
		conn, err := ln.Listener.Accept() // (X) ln.Accept()
		if err != nil {
			errc <- err
			return
		}
		connc <- conn
	}()

	select {
	case <-ln.stopc:
		if cerr := ln.Close(); cerr != nil {
			return nil, cerr
		}
		return nil, ErrListenerStopped
	case err := <-errc:
		return nil, err
	case conn := <-connc:
		tc, ok := conn.(*net.TCPConn)
		if ok {
			tc.SetKeepAlive(true)
			tc.SetKeepAlivePeriod(3 * time.Minute)
		}
		return conn, nil
	}
}
