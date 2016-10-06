#!/usr/bin/env bash
set -ex

echo "killing etcdlabs server (sending SIGINT)"
kill -2 $(lsof -ti tcp:2200)

sleep 3s
echo "killing etcd servers (sending SIGINT)"
kill -2 $(lsof -ti tcp:2379)
kill -2 $(lsof -ti tcp:2389)
kill -2 $(lsof -ti tcp:2399)
kill -2 $(lsof -ti tcp:2409)
kill -2 $(lsof -ti tcp:2419)

sleep 3s
echo "killing Angular2 server"
kill -2 $(lsof -ti tcp:4200)
