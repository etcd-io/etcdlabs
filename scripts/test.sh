#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/test.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

IGNORE_PKGS="(vendor)"
TESTS=`find . -name \*_test.go | while read a; do dirname $a; done | sort | uniq | egrep -v "$IGNORE_PKGS"`

# TODO: run with multi-CPU (not right now because of port conflict)
echo "Running tests...";
go test -v -cpu 1 $TESTS;
go test -v -cpu 1 -race $TESTS;

echo "Checking gofmt..."
fmtRes=$(gofmt -l -s $TESTS 2>&1 >/dev/null)
if [ -n "${fmtRes}" ]; then
	echo -e "gofmt checking failed:\n${fmtRes}"
	exit 255
fi

echo "Checking govet..."
vetRes=$(go vet $TESTS 2>&1 >/dev/null)
if [ -n "${vetRes}" ]; then
	echo -e "govet checking failed:\n${vetRes}"
	exit 255
fi

echo "Success";
