#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/shutdown-local-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

sleep 2s
echo "Killing Angular 2 server (sending SIGINT)"
for PORT in 4200; do
    echo "SIGINT to" ${PORT}
    if [ -n "$(lsof -ti tcp:${PORT})" ]; then
        kill -2 $(lsof -ti tcp:${PORT})
        echo "Killed" ${PORT}
    else
        echo ${PORT} "has no processes"
    fi
done

sleep 2s
echo "Killing etcdlabs server (sending SIGINT)"
for PORT in 2200; do
    echo "SIGINT to" ${PORT}
    if [ -n "$(lsof -ti tcp:${PORT})" ]; then
        kill -2 $(lsof -ti tcp:${PORT})
        echo "Killed" ${PORT}
    else
        echo ${PORT} "has no processes"
    fi
done

sleep 2s
echo "Killing etcd servers (sending SIGINT)"
for PORT in 2389 2390 2391 2392 2393 2394 2395 2396 2397 2398; do
    echo "SIGINT to" ${PORT}
    if [ -n "$(lsof -ti tcp:${PORT})" ]; then
        kill -2 $(lsof -ti tcp:${PORT})
        echo "Killed" ${PORT}
    else
        echo ${PORT} "has no processes"
    fi
done

echo ""
echo "Done!"

<<COMMENT
kill -2 $(lsof -ti tcp:4200)
kill -9 $(lsof -ti tcp:2389)
kill -2 $(lsof -ti tcp:2379)
kill -2 $(lsof -ti tcp:2380)
kill -9 $(lsof -ti tcp:2379)
kill -9 $(lsof -ti tcp:2380)
COMMENT
