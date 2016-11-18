#!/usr/bin/env bash
set -e

ACBUILD_VER=v0.4.0
DOWNLOAD_URL=https://github.com/containers/build/releases/download

curl -L ${DOWNLOAD_URL}/${ACBUILD_VER}/acbuild-${ACBUILD_VER}.tar.gz -o /tmp/acbuild.tar.gz

rm -rf /tmp/acbuild
tar xzvf /tmp/acbuild.tar.gz -C /tmp/ --strip-components=1

sudo cp /tmp/acbuild /usr/local/bin/acbuild

acbuild version
