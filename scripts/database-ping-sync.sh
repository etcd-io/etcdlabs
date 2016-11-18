#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/database-ping-sync.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

go build -v

echo "DB HOST:" ${DB_HOST}
echo "DB PORT:" ${DB_PORT}
echo "DB USER:" ${DB_USER}
echo "DB PASSWORD:" ${DB_PASSWORD}
echo "Metrics Names:" ${METRICS_NAMES}
echo "Metrics Endpoints:" ${METRICS_ENDPOINTS}

./etcdlabs --db-host ${DB_HOST} \
    --db-port ${DB_PORT} \
    --db-user ${DB_USER} \
    --db-password ${DB_PASSWORD} \
    --metrics-names ${METRICS_NAMES} \
    --metrics-endpoints ${METRICS_ENDPOINTS} \
    tester ping

./etcdlabs --db-host ${DB_HOST} \
    --db-port ${DB_PORT} \
    --db-user ${DB_USER} \
    --db-password ${DB_PASSWORD} \
    --metrics-names ${METRICS_NAMES} \
    --metrics-endpoints ${METRICS_ENDPOINTS} \
    tester sync
