#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/shutdown-prod-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

echo "stopping nginx"
sudo service nginx stop

echo "killing etcdlabs server (sending SIGINT)"
kill -2 $(lsof -ti tcp:2200)

sleep 2s
echo "killing etcd servers (sending SIGINT)"
kill -2 $(lsof -ti tcp:2379)
kill -2 $(lsof -ti tcp:2381)
kill -2 $(lsof -ti tcp:2383)
kill -2 $(lsof -ti tcp:2385)
kill -2 $(lsof -ti tcp:2387)

sleep 2s
echo "killing Angular2 server"
kill -2 $(lsof -ti tcp:4200)

tail -20 $HOME/etcdlabs.log

echo ""
echo "Done!"
