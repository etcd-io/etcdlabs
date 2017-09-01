#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/docker/etcdlabs.sh" ]]; then
  echo "must be run from repository root"
  exit 255
fi

# -P
# -p hostPort:containerPort
# -p 80:80
# -p 4200:4200
docker run \
  --rm \
  -it \
  -p 4200:4200 \
  gcr.io/etcd-development/etcdlabs:latest \
  /bin/sh -c "pushd /gopath/src/github.com/coreos/etcdlabs && ./scripts/run/etcdlabs.sh"
