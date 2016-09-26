import { Component } from '@angular/core';
import { Version, parentComponent } from './common.component';

export class etcdFlag {
    name: string;
    dataDir: string;

    protocol: string;
    ipAddress: string;
    clientPort: number;
    peerPort: number;

    initialClusterToken: string;
    initialClusterState: string;

    initialCluster: string;

    clientCertFile: string;
    clientKeyFile: string;
    clientTrustedCAFile: string;

    peerCertFile: string;
    peerKeyFile: string;
    peerTrustedCAFile: string;

    // TODO: clean this up
    constructor(
        name: string,
        dataDir: string,

        inputSecure: boolean,
        ipAddress: string,
        clientPort: number,
        peerPort: number,

        initialClusterToken: string,
        initialClusterState: string
    ) {
        this.name = name;
        this.dataDir = dataDir;

        if (inputSecure) {
            this.protocol = 'https';
        } else {
            this.protocol = 'http';
        }
        this.ipAddress = ipAddress;
        this.clientPort = clientPort;
        this.peerPort = peerPort;

        this.initialClusterToken = initialClusterToken;
        this.initialClusterState = initialClusterState;

        this.initialCluster = '';

        this.clientCertFile = '/tmp/test-certs/' + this.name + '.pem';
        this.clientKeyFile = '/tmp/test-certs/' + this.name + '-key.pem';
        this.clientTrustedCAFile = '/tmp/test-certs/trusted-ca.pem';

        this.peerCertFile = '/tmp/test-certs/' + this.name + '.pem';
        this.peerKeyFile = '/tmp/test-certs/' + this.name + '-key.pem';
        this.peerTrustedCAFile = '/tmp/test-certs/trusted-ca.pem';
    }
}

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class install_deploy_tip_Component extends parentComponent {
    inputOrganization: string;
    inputOrganizationUnit: string;
    inputLocationCity: string;
    inputLocationState: string;
    inputLocationCountry: string;

    inputKeyAlgorithm: string;
    inputKeySize: number;
    inputKeyExpirationHour: number;

    inputCommonName: string;

    inputSecure: boolean;
    inputEnableProfile: boolean;
    inputDebug: boolean;

    etcdVersionLatestRelease: string;
    inputVersion: string;

    inputClusterSize: number;

    flags: etcdFlag[];

    constructor() {
        super();

        this.inputOrganization = 'etcd';
        this.inputOrganizationUnit = 'etcd, security team';
        this.inputLocationCity = 'San Francisco';
        this.inputLocationState = 'California';
        this.inputLocationCountry = 'USA';

        this.inputKeyAlgorithm = 'rsa';
        this.inputKeySize = 4096;
        this.inputKeyExpirationHour = 87600;

        this.inputCommonName = 'etcd';

        this.inputSecure = true;
        this.inputEnableProfile = false;
        this.inputDebug = false;

        this.etcdVersionLatestRelease = super.getVersion().etcdVersionLatestRelease;
        this.inputVersion = this.etcdVersionLatestRelease;

        this.inputClusterSize = 3;

        this.flags = [
            new etcdFlag(
                'test-name-1',
                '/tmp/test-name-1.data',
                this.inputSecure,
                'localhost',
                12379,
                12380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-2',
                '/tmp/test-name-2.data',
                this.inputSecure,
                'localhost',
                22379,
                22380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-3',
                '/tmp/test-name-3.data',
                this.inputSecure,
                'localhost',
                32379,
                32380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-4',
                '/tmp/test-name-4.data',
                this.inputSecure,
                'localhost',
                4379,
                4380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-5',
                '/tmp/test-name-5.data',
                this.inputSecure,
                'localhost',
                5379,
                5380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-6',
                '/tmp/test-name-6.data',
                this.inputSecure,
                'localhost',
                6379,
                6380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-name-7',
                '/tmp/test-name-7.data',
                this.inputSecure,
                'localhost',
                7379,
                7380,
                'test-token',
                'new'
            ),
        ];
    }

    getCfsslCommandInitial() {
        return `go get -v github.com/cloudflare/cfssl/cmd/cfssl
go get -v github.com/cloudflare/cfssl/cmd/cfssljson

rm -rf /tmp/test-certs && mkdir -p /tmp/test-certs
`;
    }

    getCfsslCommandRootCA() {
        return `echo '{
  "key": {
    "algo": "${this.inputKeyAlgorithm}",
    "size": ${this.inputKeySize}
  },
  "names": [
    {
      "O": "${this.inputOrganization}",
      "OU": "${this.inputOrganizationUnit}",
      "L": "${this.inputLocationCity}",
      "ST": "${this.inputLocationState}",
      "C": "${this.inputLocationCountry}"
    }
  ],
  "CN": "${this.inputCommonName}"
}
' > /tmp/test-certs/trusted-ca-csr.json

cfssl gencert --initca=true /tmp/test-certs/trusted-ca-csr.json | cfssljson --bare /tmp/test-certs/trusted-ca
`;
    }

    getCfsslCommandConfig() {
        return `echo '{
  "signing": {
    "default": {
        "usages": [
          "signing",
          "key encipherment",
          "server auth",
          "client auth"
        ],
        "expiry": "${this.inputKeyExpirationHour}h"
    }
  }
}
' > /tmp/test-certs/gencert-config.json
`;
    }

    getCfsslCommandKeys(flag: etcdFlag) {
        let hostTxt = `    "localhost"`;
        if (flag.ipAddress !== 'localhost') {
            hostTxt += `,
    "${flag.ipAddress}"`;
        }

        return `echo '{
  "key": {
    "algo": "${this.inputKeyAlgorithm}",
    "size": ${this.inputKeySize}
  },
  "names": [
    {
      "O": "${this.inputOrganization}",
      "OU": "${this.inputOrganizationUnit}",
      "L": "${this.inputLocationCity}",
      "ST": "${this.inputLocationState}",
      "C": "${this.inputLocationCountry}"
    }
  ],
  "CN": "${this.inputCommonName}",
  "hosts": [
${hostTxt}
  ]
}
' > /tmp/test-certs/request-ca-csr-${flag.name}.json

cfssl gencert` + ' \\' + `
    ` + '--ca /tmp/test-certs/trusted-ca.pem' + ' \\' + `
    ` + '--ca-key /tmp/test-certs/trusted-ca-key.pem' + ' \\' + `
    ` + '--config /tmp/test-certs/gencert-config.json' + ' \\' + `
    ` + `/tmp/test-certs/request-ca-csr-${flag.name}.json | cfssljson --bare /tmp/test-certs/${flag.name}`;
    }

    getEtcdCommandInitial() {
        return `ETCD_VER=${this.inputVersion}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + "DOWNLOAD_URL=${GOOGLE_URL}" + `
`;
    }

    getEtcdCommandInstallLinux() {
        return "rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz" + `
` + "curl -L ${DOWNLOAD_PATH}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz" + `
rm -rf /tmp/etcd-test && mkdir -p /tmp/etcd-test
` + "tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/etcd-test --strip-components=1" + `

/tmp/etcd-test/etcd --version
`;
    }

    getEtcdCommandInstallOSX() {
        return "rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip" + `
` + "curl -L ${DOWNLOAD_PATH}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip" + `
rm -rf /tmp/etcd-test
` + "unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp && mv /tmp/etcd-${ETCD_VER}-darwin-amd64 /tmp/etcd-test" + `

/tmp/etcd-test/etcd --version
`;
    }

    getClientURL(flag: etcdFlag) {
        if (this.inputSecure) {
            flag.protocol = 'https';
        } else {
            flag.protocol = 'http';
        }
        return flag.protocol + '://' + flag.ipAddress + ':' + String(flag.clientPort);
    }

    getPeerURL(flag: etcdFlag) {
        if (this.inputSecure) {
            flag.protocol = 'https';
        } else {
            flag.protocol = 'http';
        }
        return flag.protocol + '://' + flag.ipAddress + ':' + String(flag.peerPort);
    }

    getInitialCluster() {
        if (this.inputClusterSize > 7) {
            return '(error: cluster size over 7 is not supported)';
        }

        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }

            if (this.inputSecure) {
                this.flags[_i].protocol = 'https';
            } else {
                this.flags[_i].protocol = 'http';
            }

            txt += this.flags[_i].name + '=' + this.getPeerURL(this.flags[_i]);

            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        for (let _i = 0; _i < this.flags.length; _i++) {
            this.flags[_i].initialCluster = txt;
        }
        return txt;
    }

    getEtcdCommandBash(flag: etcdFlag) {
        let cmd = '/tmp/etcd-test/etcd' + ' ' + '--name' + ' ' + flag.name + ' ' + '--data-dir' + ' ' + flag.dataDir + ' \\' + `
    ` + '--listen-client-urls' + ' ' + this.getClientURL(flag) + ' ' + '--advertise-client-urls' + ' ' + this.getClientURL(flag) + ' \\' + `
    ` + '--listen-peer-urls' + ' ' + this.getPeerURL(flag) + ' ' + '--initial-advertise-peer-urls' + ' ' + this.getPeerURL(flag) + ' \\' + `
    ` + '--initial-cluster' + ' ' + this.getInitialCluster() + ' \\' + `
    ` + '--initial-cluster-token' + ' ' + flag.initialClusterToken + ' ' + '--initial-cluster-state' + ' ' + flag.initialClusterState;

        if (this.inputSecure) {
            cmd += ' \\' + `
    ` + '--client-cert-auth' + ' \\' + `
    ` + '--cert-file' + ' ' + flag.clientCertFile + ' \\' + `
    ` + '--key-file' + ' ' + flag.clientKeyFile + ' \\' + `
    ` + '--trusted-ca-file' + ' ' + flag.clientTrustedCAFile + ' \\' + `
    ` + '--peer-client-cert-auth' + ' \\' + `
    ` + '--peer-cert-file' + ' ' + flag.peerCertFile + ' \\' + `
    ` + '--peer-key-file' + ' ' + flag.peerKeyFile + ' \\' + `
    ` + '--peer-trusted-ca-file' + ' ' + flag.peerTrustedCAFile;
        }

        if (this.inputEnableProfile) {
            cmd += ' \\' + `
    ` + '--enable-pprof';
        }

        if (this.inputDebug) {
            cmd += ' \\' + `
    ` + '--debug';
        }

        return cmd;
    }
}
