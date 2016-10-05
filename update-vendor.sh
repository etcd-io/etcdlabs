#!/usr/bin/env bash
set -e

GLIDE_ROOT="$GOPATH/src/github.com/Masterminds/glide"
go get -v github.com/Masterminds/glide
go get -v github.com/sgotti/glide-vc
GLIDE_SHA=3e49dce57f4a3a1e9bc55475065235766000d2f0
pushd "${GLIDE_ROOT}"
	# git reset --hard HEAD
	git reset --hard ${GLIDE_SHA}
	go install
popd

rm -rf vendor

glide --verbose update --delete --strip-vendor --strip-vcs --update-vendored --skip-test
# glide --verbose update --delete --strip-vendor --strip-vcs --update-vendored --skip-test --force

glide vc --only-code --no-tests

