import { Component } from '@angular/core';
import { parentComponent } from './common.component';

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
    selector: 'app-install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class install_deploy_tip_Component extends parentComponent {
    ////////////////////////////////////
    // etcd setting properties
    inputSecure: boolean;
    inputEnableProfile: boolean;
    inputDebug: boolean;

    etcdVersionLatestRelease: string;
    inputEtcdVersion: string;

    inputClusterSize: number;

    flags: etcdFlag[];
    ////////////////////////////////////

    ////////////////////////////////////
    // Kubernetes setting properties
    inputKubernetesVersion: string;
    ////////////////////////////////////

    ////////////////////////////////////
    // build etcd from source
    inputGoVersion: string;
    inputGitUser: string;
    inputGitBranch: string;
    ////////////////////////////////////

    ////////////////////////////////////
    // TLS setting properties
    inputCFSSLOrganization: string;
    inputCFSSLOrganizationUnit: string;
    inputCFSSLLocationCity: string;
    inputCFSSLLocationState: string;
    inputCFSSLLocationCountry: string;

    inputCFSSLKeyAlgorithm: string;
    inputCFSSLKeySize: number;
    inputCFSSLKeyExpirationHour: number;

    inputCFSSLCommonName: string;
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.inputSecure = true;
        this.inputEnableProfile = false;
        this.inputDebug = false;

        this.etcdVersionLatestRelease = super.getVersion().etcdVersionLatestRelease;
        this.inputEtcdVersion = this.etcdVersionLatestRelease;

        this.inputClusterSize = 3;

        this.flags = [
            new etcdFlag(
                'test-1',
                '/tmp/test-1.data',
                this.inputSecure,
                'localhost',
                2379,
                2380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-2',
                '/tmp/test-2.data',
                this.inputSecure,
                'localhost',
                22379,
                22380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-3',
                '/tmp/test-3.data',
                this.inputSecure,
                'localhost',
                32379,
                32380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-4',
                '/tmp/test-4.data',
                this.inputSecure,
                'localhost',
                4379,
                4380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-5',
                '/tmp/test-5.data',
                this.inputSecure,
                'localhost',
                5379,
                5380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-6',
                '/tmp/test-6.data',
                this.inputSecure,
                'localhost',
                6379,
                6380,
                'test-token',
                'new'
            ),
            new etcdFlag(
                'test-7',
                '/tmp/test-7.data',
                this.inputSecure,
                'localhost',
                7379,
                7380,
                'test-token',
                'new'
            ),
        ];
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputKubernetesVersion = 'v1.4.0';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputGoVersion = super.getVersion().goVersion;
        this.inputGitUser = 'coreos';
        this.inputGitBranch = 'master';

        this.inputCFSSLOrganization = 'etcd';
        this.inputCFSSLOrganizationUnit = 'etcd, security team';
        this.inputCFSSLLocationCity = 'San Francisco';
        this.inputCFSSLLocationState = 'California';
        this.inputCFSSLLocationCountry = 'USA';

        this.inputCFSSLKeyAlgorithm = 'rsa';
        this.inputCFSSLKeySize = 4096;
        this.inputCFSSLKeyExpirationHour = 87600;

        this.inputCFSSLCommonName = 'etcd';
        ///////////////////////////////////////////////////
    }


    ///////////////////////////////////////////////////
    getEtcdCommandInitial() {
        return `ETCD_VER=${this.inputEtcdVersion}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}';
    }

    getEtcdCommandInstallLinux() {
        return 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz && rm -rf /tmp/test-etcd && mkdir -p /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1' + `

/tmp/test-etcd/etcd --version
/tmp/test-etcd/etcdctl --version`;
    }

    getEtcdCommandInstallOSX() {
        return 'rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip && rm -rf /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp && mv /tmp/etcd-${ETCD_VER}-darwin-amd64 /tmp/test-etcd' + `

/tmp/test-etcd/etcd --version
/tmp/test-etcd/etcdctl --version`;
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

    getAllClientEndpoints() {
        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += this.flags[_i].ipAddress + ':' + String(this.flags[_i].clientPort);
            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        return txt;
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
        let cmd = '/tmp/test-etcd/etcd' + ' ' + '--name' + ' ' + flag.name + ' ' + '--data-dir' + ' ' + flag.dataDir + ' \\' + `
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

    getEtcdctlCommandBash(flag: etcdFlag) {
        let cmd = 'ETCDCTL_API=3 /tmp/test-etcd/etcdctl' + ' \\' + `
    ` + '--endpoints' + ' ' + this.getAllClientEndpoints() + ' \\' + `
    `;
        if (this.inputSecure) {
            cmd += '--cert' + ' ' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + flag.clientKeyFile + ' \\' + `
    ` + '--cacert' + ' ' + flag.clientTrustedCAFile + ' \\' + `
    `;
        }
        cmd += 'put foo bar';
        return cmd;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    getKubernetesCommandInitial() {
        return `KUBERNETES_VER=${this.inputKubernetesVersion}

DOWNLOAD_URL=https://github.com/kubernetes/kubernetes/releases/download
rm -f /tmp/kubernetes.tar.gz && rm -rf /tmp/test-kubernetes && mkdir -p /tmp/test-kubernetes

` + 'curl -L ${DOWNLOAD_URL}/${KUBERNETES_VER}/kubernetes.tar.gz -o /tmp/kubernetes.tar.gz' + `
tar xzvf /tmp/kubernetes.tar.gz -C /tmp/test-kubernetes --strip-components=1

/tmp/test-kubernetes/platforms/linux/amd64/kubectl version`;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getGoCommand() {
        return `GO_VERSION=${this.inputGoVersion}

sudo rm -f /usr/local/go/bin/go && sudo rm -rf /usr/local/go

GOOGLE_URL=https://storage.googleapis.com/golang
` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

` + 'sudo curl -s ${DOWNLOAD_URL}/go$GO_VERSION.linux-amd64.tar.gz | sudo tar -v -C /usr/local/ -xz' + `

` + 'if grep -q GOPATH "$(echo $HOME)/.bashrc"; then ' + `
    echo "bashrc already has GOPATH";
else
    echo "adding GOPATH to bashrc";` + `
    ` + 'echo "export GOPATH=$(echo $HOME)/go" >> $HOME/.bashrc;' + `
    ` + 'PATH_VAR=$PATH":/usr/local/go/bin:$(echo $HOME)/go/bin";' + `
    ` + 'echo "export PATH=$(echo $PATH_VAR)" >> $HOME/.bashrc;' + `
    ` + 'source $HOME/.bashrc;' + `
fi

mkdir -p $GOPATH/bin/
go version`;
    }

    getEtcdCommandBuildFromSource() {
        return `GIT_PATH=github.com/coreos/etcd

USER_NAME=${this.inputGitUser}
BRANCH_NAME=${this.inputGitBranch}

` + 'rm -rf ${GOPATH}/src/${GIT_PATH}' + `
` + 'git clone https://github.com/${USER_NAME}/etcd' + ' \\' + `
    ` + '--branch ${BRANCH_NAME}' + ' \\' + `
    ` + '${GOPATH}/src/${GIT_PATH}' + `

` + 'cd ${GOPATH}/src/${GIT_PATH} && ./build' + `

` + '${GOPATH}/src/${GIT_PATH}/bin/etcd --version' + `
` + '${GOPATH}/src/${GIT_PATH}/bin/etcdctl --version';
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    getCFSSLCommandInitial() {
        return `go get -v github.com/cloudflare/cfssl/cmd/cfssl
go get -v github.com/cloudflare/cfssl/cmd/cfssljson

rm -rf /tmp/test-certs && mkdir -p /tmp/test-certs`;
    }

    getCFSSLCommandRootCA() {
        return `echo '{
  "key": {
    "algo": "${this.inputCFSSLKeyAlgorithm}",
    "size": ${this.inputCFSSLKeySize}
  },
  "names": [
    {
      "O": "${this.inputCFSSLOrganization}",
      "OU": "${this.inputCFSSLOrganizationUnit}",
      "L": "${this.inputCFSSLLocationCity}",
      "ST": "${this.inputCFSSLLocationState}",
      "C": "${this.inputCFSSLLocationCountry}"
    }
  ],
  "CN": "${this.inputCFSSLCommonName}"
}' > /tmp/test-certs/trusted-ca-csr.json

cfssl gencert --initca=true /tmp/test-certs/trusted-ca-csr.json | cfssljson --bare /tmp/test-certs/trusted-ca
`;
    }

    getCFSSLCommandConfig() {
        return `echo '{
  "signing": {
    "default": {
        "usages": [
          "signing",
          "key encipherment",
          "server auth",
          "client auth"
        ],
        "expiry": "${this.inputCFSSLKeyExpirationHour}h"
    }
  }
}' > /tmp/test-certs/gencert-config.json
`;
    }

    getCFSSLCommandKeys(flag: etcdFlag) {
        let hostTxt = `    "localhost"`;
        if (flag.ipAddress !== 'localhost') {
            hostTxt += `,
    "${flag.ipAddress}"`;
        }

        return `echo '{
  "key": {
    "algo": "${this.inputCFSSLKeyAlgorithm}",
    "size": ${this.inputCFSSLKeySize}
  },
  "names": [
    {
      "O": "${this.inputCFSSLOrganization}",
      "OU": "${this.inputCFSSLOrganizationUnit}",
      "L": "${this.inputCFSSLLocationCity}",
      "ST": "${this.inputCFSSLLocationState}",
      "C": "${this.inputCFSSLLocationCountry}"
    }
  ],
  "CN": "${this.inputCFSSLCommonName}",
  "hosts": [
${hostTxt}
  ]
}' > /tmp/test-certs/request-ca-csr-${flag.name}.json

cfssl gencert` + ' \\' + `
    ` + '--ca /tmp/test-certs/trusted-ca.pem' + ' \\' + `
    ` + '--ca-key /tmp/test-certs/trusted-ca-key.pem' + ' \\' + `
    ` + '--config /tmp/test-certs/gencert-config.json' + ' \\' + `
    ` + `/tmp/test-certs/request-ca-csr-${flag.name}.json | cfssljson --bare /tmp/test-certs/${flag.name}`;
    }
    ///////////////////////////////////////////////////
}
