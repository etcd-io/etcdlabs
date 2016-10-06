#!/usr/bin/env bash
set -e

GLIDE_ROOT="$GOPATH/src/github.com/Masterminds/glide"
go get -v github.com/Masterminds/glide
go get -v github.com/sgotti/glide-vc
GLIDE_SHA=cfde1caa6b394a320fc65c5abc77646d18febff9
pushd "${GLIDE_ROOT}"
	# git reset --hard HEAD
	git reset --hard ${GLIDE_SHA}
	go install
popd

rm -rf vendor

glide update --strip-vendor --skip-test
glide vc --no-tests --only-code

