#!/usr/bin/env bash
set -ex

<<COMMENT
rm -f /tmp/cfssl* && rm -rf /tmp/certs && mkdir -p /tmp/certs

curl -L https://pkg.cfssl.org/R1.2/cfssl_linux-amd64 -o /tmp/cfssl
chmod +x /tmp/cfssl
sudo mv /tmp/cfssl /usr/local/bin/cfssl

curl -L https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64 -o /tmp/cfssljson
chmod +x /tmp/cfssljson
sudo mv /tmp/cfssljson /usr/local/bin/cfssljson

/usr/local/bin/cfssl version
/usr/local/bin/cfssljson -h

mkdir -p $HOME/certs


rm -f /tmp/cfssl* && rm -rf /tmp/certs && mkdir -p /tmp/certs

curl -L https://pkg.cfssl.org/R1.2/cfssl_darwin-amd64 -o /tmp/cfssl
chmod +x /tmp/cfssl
sudo mv /tmp/cfssl /usr/local/bin/cfssl

curl -L https://pkg.cfssl.org/R1.2/cfssljson_darwin-amd64 -o /tmp/cfssljson
chmod +x /tmp/cfssljson
sudo mv /tmp/cfssljson /usr/local/bin/cfssljson

/usr/local/bin/cfssl version
/usr/local/bin/cfssljson -h

mkdir -p $HOME/certs
COMMENT

go get -v github.com/cloudflare/cfssl/cmd/cfssl
go get -v github.com/cloudflare/cfssl/cmd/cfssljson

# Generate self-signed root CA certificate and private key
echo '{
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
}' > ./trusted-ca-csr.json

cfssl gencert --initca=true ./trusted-ca-csr.json | cfssljson -bare ./trusted-ca


# generating a local-issued certificate and private key
echo '{
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
}' > ./request-ca-csr.json

echo '{
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
}' > ./gencert-config.json

cfssl gencert \
    -ca ./trusted-ca.pem \
    -ca-key ./trusted-ca-key.pem \
    -config ./gencert-config.json \
    ./request-ca-csr.json | cfssljson -bare ./test-cert


openssl x509 -in ./trusted-ca.pem -text -noout
openssl x509 -in ./test-cert.pem -text -noout
