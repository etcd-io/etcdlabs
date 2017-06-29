#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/dep/go.sh" ]]; then
  echo "must be run from repository root"
  exit 255
fi

# update depedency
# 1. edit glide.yaml with version, git SHA
# 2. run scripts/dep/go.sh
# 3. it automatically detects new git SHA, and vendors updates to cmd/vendor directory
#
# add depedency
# 1. run scripts/dep/go.sh github.com/USER/PROJECT#^1.0.0
#     OR
#    scripts/dep/go.sh github.com/USER/PROJECT#9b772b54b3bf0be1eec083c9669766a56332559a
#    scripts/dep/go.sh golang.org/x/time#711ca1cb87636abec28122ef3bc6a77269d433f3
# 2. make sure glide.yaml and glide.lock are updated

GLIDE_ROOT="$GOPATH/src/github.com/Masterminds/glide"
go get -d -u github.com/Masterminds/glide
pushd "${GLIDE_ROOT}"
  git reset --hard HEAD
  go install -v
popd

GLIDE_VC_ROOT="$GOPATH/src/github.com/sgotti/glide-vc"
go get -d -u github.com/sgotti/glide-vc
pushd "${GLIDE_VC_ROOT}"
  git reset --hard HEAD
  go install -v
popd

rm -rf ./vendor

if [ -n "$1" ]; then
  echo "glide get on $(echo $1)"
  glide get --strip-vendor $1
else
  echo "glide update on *"
  glide update --strip-vendor
fi;

glide vc --no-tests --only-code
