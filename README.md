# etcdlabs

[![Go Report Card](https://goreportcard.com/badge/github.com/etcd-io/etcdlabs?style=flat-square)](https://goreportcard.com/report/github.com/etcd-io/etcdlabs)
[![Build Status](https://img.shields.io/travis/etcd-io/etcdlabs.svg?style=flat-square)](https://travis-ci.com/etcd-io/etcdlabs)
[![Godoc](http://img.shields.io/badge/go-documentation-blue.svg?style=flat-square)](https://godoc.org/github.com/etcd-io/etcdlabs)

- [etcd website](http://play.etcd.io)

<img src="./etcdlabs.gif" alt="etcdlabs" width="620">

See [etcd-play][old-etcd-play] for old code.

#### Technology Used

- Frontend
    - [Angular](https://angular.io/)
    - [Angular Material](https://github.com/angular/material2)
    - [TypeScript](https://www.typescriptlang.org/index.html)
- Backend
    - [Go](https://golang.org/)

[old-etcd-play]: https://github.com/coreos/etcd-play
[cistat]: https://travis-ci.com/etcd-io/etcdlabs
[etcdlabs-godoc]: https://godoc.org/github.com/etcd-io/etcdlabs

#### Build and Push to gcr.io

```bash
./scripts/docker/build-push.sh
```

#### Run locally

```bash
docker build --tag gcr.io/etcd-development/etcdlabs:latest --file ./Dockerfile .

docker run \
  --rm \
  -it \
  -p 4200:4200 \
  gcr.io/etcd-development/etcdlabs:latest \
  /bin/sh -c "pushd /gopath/src/github.com/etcd-io/etcdlabs && ./scripts/run/etcdlabs.sh"
```

Or

```bash
./scripts/docker/etcdlabs.sh
```

To check that it's running:

```bash
curl -L http://localhost:4200/health
OK
```

And open http://localhost:4200
