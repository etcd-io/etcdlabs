#!/usr/bin/env bash
set -e

docker login quay.io
docker push quay.io/coreos/etcdlabs:latest
