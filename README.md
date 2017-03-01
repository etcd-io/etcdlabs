# etcdlabs

[![Build Status](https://img.shields.io/travis/coreos/etcdlabs.svg?style=flat-square)][cistat] [![Godoc](http://img.shields.io/badge/go-documentation-blue.svg?style=flat-square)][etcdlabs-godoc]

- [etcd website](http://play.etcd.io)
- [Debug etcd](./debug-etcd)

See [etcd-play][old-etcd-play] for old code.

#### Technology Used

- Frontend
    - [Angular 2](https://angular.io/)
    - [Angular 2 Material](https://github.com/angular/material2)
    - [TypeScript](https://www.typescriptlang.org/index.html)
- Backend
    - [Go](https://golang.org/)

[old-etcd-play]: https://github.com/coreos/etcd-play
[cistat]: https://travis-ci.org/coreos/etcdlabs
[etcdlabs-godoc]: https://godoc.org/github.com/coreos/etcdlabs


#### Deploy

To run locally

```
# backend
docker run --net=host \
  --name etcdlabs-backend \
  quay.io/coreos/etcdlabs:latest /go/bin/etcdlabs web \
  --skip-database \
  --web-port 2200

# frontend
docker run --net=host \
  --name etcdlabs-frontend \
  quay.io/coreos/etcdlabs:latest yarn start
```
