#!/usr/bin/env bash
set -ex

echo "restarting nginx"
sudo apt-get install -y nginx
sudo service nginx stop
sudo cp ./nginx.conf /etc/nginx/sites-available/default
sudo service nginx restart
sudo systemctl status nginx.service

echo "building backend ectcdlabs"
go build -v

echo "running backend etcdlabs"
nohup ./etcdlabs >> $HOME/etcdlabs.log 2>&1 &

sleep 3s
echo "starting frontend"
nohup npm start >> $HOME/etcdlabs-npm.log 2>&1 &

sleep 2s
cat $HOME/etcdlabs-npm.log
cat $HOME/etcdlabs.log
# tail -f $HOME/etcdlabs-npm.log
# tail -f $HOME/etcdlabs.log
