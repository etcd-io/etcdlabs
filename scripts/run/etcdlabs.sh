#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/run/etcdlabs.sh" ]]; then
  echo "must be run from repository root"
  exit 255
fi

./backend-web-server -web-port 2200 &
yarn start-prod &
wait
