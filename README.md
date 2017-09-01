# etcdlabs

[![Go Report Card](https://goreportcard.com/badge/github.com/coreos/etcdlabs?style=flat-square)](https://goreportcard.com/report/github.com/coreos/etcdlabs)
[![Build Status](https://img.shields.io/travis/coreos/etcdlabs.svg?style=flat-square)](https://travis-ci.org/coreos/etcdlabs)
[![Godoc](http://img.shields.io/badge/go-documentation-blue.svg?style=flat-square)](https://godoc.org/github.com/coreos/etcdlabs)

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
[cistat]: https://travis-ci.org/coreos/etcdlabs
[etcdlabs-godoc]: https://godoc.org/github.com/coreos/etcdlabs

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
  -p 2389:2389 \
  -p 2391:2391 \
  -p 2393:2393 \
  -p 2395:2395 \
  -p 2397:2397 \
  -p 4200:4200 \
  gcr.io/etcd-development/etcdlabs:latest \
  /bin/sh -c "pushd /gopath/src/github.com/coreos/etcdlabs && ./scripts/run/etcdlabs.sh"
```

Or

```bash
./scripts/docker/etcdlabs.sh
```

To check that it's running:

```bash
curl -L http://localhost:4200/healthz
ok
```

And open http://localhost:4200
