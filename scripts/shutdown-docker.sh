#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/shutdown-docker.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

docker stop --force etcdlabs
docker rmi --force etcdlabs

docker ps -a -q
docker images
