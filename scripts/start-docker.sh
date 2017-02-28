#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/start-docker.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

docker run --detach --net=host \
  --name etcdlabs \
  etcdlabs

docker run --detach --ulimit nofile=262144:262144 --net=host \
  --name etcdlabs \
  etcdlabs
