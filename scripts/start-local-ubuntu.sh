#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/start-local-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

echo "building backend ectcdlabs"
go build -v

echo "running backend etcdlabs"
nohup ./etcdlabs web --skip-database --web-port 2200 > /tmp/etcdlabs-backend.log 2>&1 &

sleep 3s
echo "starting frontend"
nohup yarn start > /tmp/etcdlabs-frontend.log 2>&1 &

sleep 2s
cat /tmp/etcdlabs-backend.log

sleep 2s
cat /tmp/etcdlabs-frontend.log

echo ""
echo "Ready!"
