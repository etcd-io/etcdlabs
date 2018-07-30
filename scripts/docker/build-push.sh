#!/usr/bin/env bash
set -e

if ! [[ "$0" =~ "./scripts/docker/build-push.sh" ]]; then
    echo "must be run from repository root"
    exit 255
fi

docker build --tag gcr.io/etcd-development/etcdlabs:latest --file ./Dockerfile .
gcloud docker -- login -u _json_key -p "$(cat ${HOME}/a/keys/gcp-key-etcd-development.json)" https://gcr.io
gcloud docker -- push gcr.io/etcd-development/etcdlabs:latest
gsutil -m acl ch -u allUsers:R -r gs://artifacts.etcd-development.appspot.com
