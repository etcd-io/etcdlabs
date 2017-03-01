#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/shutdown-docker.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

docker rm --force etcdlabs-backend || true
docker stop --force etcdlabs-backend || true
docker rm --force etcdlabs-backend || true

docker rm --force etcdlabs-frontend || true
docker stop --force etcdlabs-frontend || true
docker rm --force etcdlabs-frontend || true

docker ps -a -q
docker images
