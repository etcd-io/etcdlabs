#!/usr/bin/env bash
set -e

<<COMMENT
https://yarnpkg.com/en/docs/install

yarn init
yarn install
COMMENT

sudo apt-key adv --keyserver pgp.mit.edu --recv D101F7899D41F3C3
echo "deb http://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
