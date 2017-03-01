#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/build-docker.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

docker build \
  --tag quay.io/coreos/etcdlabs:latest \
  --file ./Dockerfile \
  .
