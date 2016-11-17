#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/install-frontend-dependency.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

yarn install
npm rebuild node-sass
yarn install
npm install
