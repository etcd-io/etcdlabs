#!/usr/bin/env bash
set -ex

echo "building backend ectcdlabs"
go build -v

echo "running backend etcdlabs"
nohup ./etcdlabs >> /tmp/etcdlabs.log 2>&1 &

sleep 3s
echo "starting frontend"
nohup npm start >> /tmp/etcdlabs-npm.log 2>&1 &

sleep 2s
cat /tmp/etcdlabs-npm.log
cat /tmp/etcdlabs.log

<<COMMENT
tail -f /tmp/etcdlabs-npm.log
tail -f /tmp/etcdlabs.log
COMMENT

