#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/update-vendor.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

# update,add depedency
# 1. edit manifest.json with version, git SHA
# 2. run ./script-update-vendor.sh
# 3. it automatically detects new git SHA, and vendors updates to cmd/vendor directory

DEP_ROOT="$GOPATH/src/github.com/golang/dep"
go get -v github.com/golang/dep/cmd/dep
pushd "${DEP_ROOT}"
	git reset --hard HEAD
	go install -v ./cmd/dep
popd

DEP_VC_ROOT="$GOPATH/src/github.com/sgotti/glide-vc"
go get -v github.com/sgotti/glide-vc
pushd "${DEP_VC_ROOT}"
	git reset --hard HEAD
	go install -v
popd

rm -rf ./vendor

dep ensure -v
