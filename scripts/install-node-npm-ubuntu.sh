#!/usr/bin/env bash
set -ex

# remove NodeJS
sudo apt-get remove -y nodejs nodejs-legacy
sudo apt-get -y autoremove
sudo apt-get -y autoclean
sudo apt-get -y update

# add NodeJS PPA
# sudo apt-get -y install python-software-properties
# curl -sL https://deb.nodesource.com/setup_6.x -o $HOME/nodesource_setup.sh

# install nvm
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh -o $HOME/install_nvm.sh
cat $HOME/install_nvm.sh
bash $HOME/install_nvm.sh
source $HOME/.profile
nvm ls-remote

# install NodeJS
# sudo apt-get install -y build-essential libssl-dev
# sudo apt-get install -y nodejs
# sudo apt-get install -y npm
nvm install 6.6.0

# check NodeJS version
node -v
npm -v
