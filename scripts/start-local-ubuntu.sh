#!/usr/bin/env bash
set -ex

if ! [[ "$0" =~ "scripts/start-local-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

echo "building backend ectcdlabs"
go build -v

echo "running backend etcdlabs"
nohup ./etcdlabs >> /tmp/etcdlabs.log 2>&1 &

sleep 5s
echo "starting frontend"
nohup npm start >> /tmp/etcdlabs-npm.log 2>&1 &

sleep 5s
cat /tmp/etcdlabs.log
cat /tmp/etcdlabs-npm.log

<<COMMENT
tail -f /tmp/etcdlabs.log
tail -f /tmp/etcdlabs-npm.log
COMMENT
