#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/run/etcdlabs.sh" ]]; then
  echo "must be run from repository root"
  exit 255
fi

./backend-web-server -web-port 2200 -record-tester-endpoints http://10.240.0.34:9028,http://10.240.0.40:9028 -logtostderr=true &
yarn start-prod &
wait
