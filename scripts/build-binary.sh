#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/build-binary.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

go build -v
