#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/start-docker-local.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi


docker run quay.io/coreos/etcdlabs:latest /go/bin/etcdlabs --help
docker run quay.io/coreos/etcdlabs:latest yarn --version


echo "Starting etcdlabs-backend"
docker rm --force etcdlabs-backend || true
docker run --detach --net=host \
  --ulimit nofile=262144:262144 \
  --name etcdlabs-backend \
  quay.io/coreos/etcdlabs:latest /go/bin/etcdlabs web \
  --skip-database \
  --web-port 2200

<<COMMENT
docker logs etcdlabs-backend
COMMENT


sleep 3s


echo "Starting etcdlabs-frontend"
docker rm --force etcdlabs-frontend || true
docker run --detach --net=host \
  --ulimit nofile=262144:262144 \
  --name etcdlabs-frontend \
  quay.io/coreos/etcdlabs:latest yarn start

<<COMMENT
docker logs etcdlabs-frontend
COMMENT
