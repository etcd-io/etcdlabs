#!/usr/bin/env bash
set -e

<<COMMENT
https://yarnpkg.com/en/docs/install

yarn init

yarn install
npm rebuild node-sass
yarn install
npm install

yarn start
COMMENT

sudo curl https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb http://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get -y update && sudo apt-get -y install yarn
