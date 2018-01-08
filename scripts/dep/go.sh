#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/dep/go.sh" ]]; then
  echo "must be run from repository root"
  exit 255
fi

dep ensure -v
dep prune -v
