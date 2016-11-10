#!/usr/bin/env bash
set -e

sudo apt-get -y update
sudo apt-get -y install mysql-client
sudo apt autoremove -y

<<COMMENT
mysql --host=${DB_HOST} --port=${DB_PORT} --user=${DB_USER} --password=${DB_PASSWORD}
COMMENT
