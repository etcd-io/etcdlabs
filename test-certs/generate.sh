#!/usr/bin/env bash
set -ex

go get -v github.com/cloudflare/cfssl/cmd/cfssl
go get -v github.com/cloudflare/cfssl/cmd/cfssljson

# Generate self-signed root CA certificate and private key
echo '
{
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "O": "etcd",
      "OU": "etcd, security",
      "L": "San Francisco",
      "ST": "California",
      "C": "US"
    }
  ],
  "CN": "etcd"
}
' > ./trusted-ca-csr.json

cfssl gencert --initca=true ./trusted-ca-csr.json | cfssljson -bare ./trusted-ca


# generating a local-issued certificate and private key
echo '
{
  "key": {
    "algo": "rsa",
    "size": 4096
  },
  "names": [
    {
      "O": "etcd",
      "OU": "etcd, security",
      "L": "San Francisco",
      "ST": "California",
      "C": "US"
    }
  ],
  "CN": "etcd",
  "hosts": [
    "localhost"
  ]
}
' > ./request-ca-csr.json

echo '
{
  "signing": {
    "default": {
        "usages": [
          "signing",
          "key encipherment",
          "server auth",
          "client auth"
        ],
        "expiry": "87600h"
    }
  }
}
' > ./gencert-config.json

cfssl gencert \
    -ca ./trusted-ca.pem \
    -ca-key ./trusted-ca-key.pem \
    -config ./gencert-config.json \
    ./request-ca-csr.json | cfssljson -bare ./test-cert

