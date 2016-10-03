#!/usr/bin/env bash
set -ex

printf "\n"
echo "building backend ectcdlabs"
go install -v

printf "\n"
echo "running backend etcdlabs"
nohup etcdlabs >> $HOME/etcdlabs.log 2>&1 &

sleep 3s

printf "\n"
echo "starting frontend"
npm start
