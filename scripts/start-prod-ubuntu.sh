#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/start-prod-ubuntu.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

echo "restarting nginx"
sudo apt-get install -y nginx
sudo service nginx stop
sudo cp ./nginx.conf /etc/nginx/sites-available/default
sudo service nginx restart
sudo systemctl status nginx --no-pager

echo "building backend ectcdlabs"
go build -v

echo "running backend etcdlabs"
nohup ./etcdlabs --db-host ${DB_HOST} \
    --db-port ${DB_PORT} \
    --db-user ${DB_USER} \
    --metrics-names ${METRICS_NAMES} \
    --metrics-endpoints ${METRICS_ENDPOINTS} \
    web --web-port 2200 > $HOME/etcdlabs-backend.log 2>&1 &

sleep 3s
echo "starting frontend"
# TODO: doesn't work with Angular 2.2.0
# See https://github.com/angular/angular/issues/11076
nohup yarn start-prod > $HOME/etcdlabs-frontend.log 2>&1 &

sleep 2s
cat $HOME/etcdlabs-backend.log
cat $HOME/etcdlabs-frontend.log

echo ""
echo "Ready!"
