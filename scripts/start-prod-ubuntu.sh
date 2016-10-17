#!/usr/bin/env bash
set -ex

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
nohup ./etcdlabs >> $HOME/etcdlabs.log 2>&1 &

sleep 5s
echo "starting frontend"
nohup npm start >> $HOME/etcdlabs-npm.log 2>&1 &

sleep 5s
cat $HOME/etcdlabs.log
cat $HOME/etcdlabs-npm.log

<<COMMENT
tail -f /tmp/etcdlabs.log
tail -f /tmp/etcdlabs-npm.log
COMMENT
