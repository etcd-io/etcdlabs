#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/dep/frontend.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

# npm install -g tslint
yarn install
npm rebuild node-sass
yarn install
npm install
