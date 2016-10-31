#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/shutdown-local-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

sleep 2s
echo "Killing Angular 2 server (sending SIGINT)"
kill -2 $(lsof -ti tcp:4200)

sleep 2s
echo "Killing etcdlabs server (sending SIGINT)"
kill -2 $(lsof -ti tcp:2200)

sleep 2s
echo "Killing etcd servers (sending SIGINT)"
kill -2 $(lsof -ti tcp:2389)
kill -2 $(lsof -ti tcp:2390)
kill -2 $(lsof -ti tcp:2391)
kill -2 $(lsof -ti tcp:2392)
kill -2 $(lsof -ti tcp:2393)
kill -2 $(lsof -ti tcp:2394)
kill -2 $(lsof -ti tcp:2395)
kill -2 $(lsof -ti tcp:2396)
kill -2 $(lsof -ti tcp:2397)
kill -2 $(lsof -ti tcp:2398)

tail -20 $HOME/etcdlabs.log

echo ""
echo "Done!"
