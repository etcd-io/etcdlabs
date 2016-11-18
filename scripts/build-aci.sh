#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "scripts/build-aci.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

VERSION=v0.0.8

TMPHOSTS="$(mktemp)"
cat <<DF > $TMPHOSTS
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
DF
cat ${TMPHOSTS}

acbuild --debug begin

acbuild --debug copy "$TMPHOSTS" /etc/hosts
acbuild --debug set-name coreos.com/etcdlabs

acbuild --debug copy etcdlabs /etcdlabs
acbuild --debug copy-to-dir node_modules .
acbuild --debug copy-to-dir frontend .

acbuild --debug label add version "$VERSION"

sudo acbuild --debug write --overwrite ./etcdlabs.aci
acbuild --debug end
