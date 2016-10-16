import { Component } from '@angular/core';
import { parentComponent } from './common.component';

export class etcdFlag {
    name: string;

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

    constructor(
        name: string,

        inputSecure: boolean,
        ipAddress: string,
        clientPort: number,
        peerPort: number,

        initialClusterToken: string,
        initialClusterState: string
    ) {
        this.name = name;

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

        this.clientCertFile = '/etc/etcd/' + this.name + '.pem';
        this.clientKeyFile = '/etc/etcd/' + this.name + '-key.pem';
        this.clientTrustedCAFile = '/etc/etcd/trusted-ca.pem';

        this.peerCertFile = '/etc/etcd/' + this.name + '.pem';
        this.peerKeyFile = '/etc/etcd/' + this.name + '-key.pem';
        this.peerTrustedCAFile = '/etc/etcd/trusted-ca.pem';
    }
}


export class rktFlag {
    name: string;

    constructor(
        name: string,
    ) {
        this.name = name;
    }
}


@Component({
    selector: 'app-install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class InstallDeployTipComponent extends parentComponent {
    ////////////////////////////////////
    inputCFSSLExecDir: string;
    inputEtcdCertsDir: string;

    inputEtcdExecDirSource: string;
    inputEtcdExecDirVM: string;
    inputEtcdExecDirSystemd: string;
    inputRktExecDir: string;

    inputEtcdDataDirVM: string;
    inputEtcdDataDirSystemd: string;
    inputEtcdDataDirRkt: string;

    inputEtcdCertsDirVM: string;
    inputEtcdCertsDirSystemd: string;
    inputEtcdCertsDirRkt: string;
    ////////////////////////////////////

    ////////////////////////////////////
    // TLS setting properties
    inputCFSSLVersion: string;
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

    ////////////////////////////////////
    // build etcd from source
    inputGoVersion: string;
    inputGitUser: string;
    inputGitBranch: string;
    ////////////////////////////////////

    ////////////////////////////////////
    // etcd setting properties
    inputSecure: boolean;
    inputEnableProfile: boolean;
    inputDebug: boolean;
    inputAutoCompact: number;

    etcdVersionLatestRelease: string;
    inputEtcdVersionVM: string;
    inputEtcdVersionSystemd: string;

    inputClusterSize: number;

    etcdFlags: etcdFlag[];
    ////////////////////////////////////

    ////////////////////////////////////
    // rkt setting properties
    inputEtcdVersionRkt: string;
    inputRktVersion: string;

    rktFlags: rktFlag[];
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.inputCFSSLExecDir = '/usr/local/bin';
        this.inputEtcdCertsDir = '/etc/etcd';

        this.inputEtcdExecDirSource = '/';
        this.inputEtcdExecDirVM = '/';
        this.inputEtcdExecDirSystemd = '/';
        this.inputRktExecDir = '/';

        this.inputEtcdDataDirVM = '/var/lib/etcd';
        this.inputEtcdDataDirSystemd = '/var/lib/etcd';
        this.inputEtcdDataDirRkt = '/var/lib/etcd';

        this.inputEtcdCertsDirVM = '/etc/etcd';
        this.inputEtcdCertsDirSystemd = '/etc/etcd';
        this.inputEtcdCertsDirRkt = '/etc/etcd';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputCFSSLVersion = 'R1.2';
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

        ///////////////////////////////////////////////////
        this.inputGoVersion = super.getVersion().goVersion;
        this.inputGitUser = 'coreos';
        this.inputGitBranch = 'master';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputSecure = true;
        this.inputEnableProfile = false;
        this.inputDebug = false;
        this.inputAutoCompact = 1;

        this.etcdVersionLatestRelease = super.getVersion().etcdVersionLatestRelease;
        this.inputEtcdVersionVM = this.etcdVersionLatestRelease;
        this.inputEtcdVersionSystemd = this.etcdVersionLatestRelease;

        this.inputClusterSize = 3;

        this.etcdFlags = [
            new etcdFlag(
                'my-etcd-1',
                this.inputSecure,
                'localhost',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-2',
                this.inputSecure,
                'localhost',
                22379,
                22380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-3',
                this.inputSecure,
                'localhost',
                32379,
                32380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-4',
                this.inputSecure,
                'localhost',
                4379,
                4380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-5',
                this.inputSecure,
                'localhost',
                5379,
                5380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-6',
                this.inputSecure,
                'localhost',
                6379,
                6380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-7',
                this.inputSecure,
                'localhost',
                7379,
                7380,
                'my-etcd-token',
                'new'
            ),
        ];

        ///////////////////////////////////////////////////
        this.inputEtcdVersionRkt = this.etcdVersionLatestRelease;
        this.inputRktVersion = 'v1.17.0';

        this.rktFlags = [
            new rktFlag(
                'my-etcd-rkt-1'
            ),
            new rktFlag(
                'my-etcd-rkt-2'
            ),
            new rktFlag(
                'my-etcd-rkt-3'
            ),
            new rktFlag(
                'my-etcd-rkt-4'
            ),
            new rktFlag(
                'my-etcd-rkt-5'
            ),
            new rktFlag(
                'my-etcd-rkt-6'
            ),
            new rktFlag(
                'my-etcd-rkt-7'
            ),
        ]
        ///////////////////////////////////////////////////
    }


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

    getEtcdBuildFromSource() {
        let divide = '/';
        if (this.inputEtcdExecDirSource === '/') {
            divide = '';
        }

        let txt = `GIT_PATH=github.com/coreos/etcd

USER_NAME=${this.inputGitUser}
BRANCH_NAME=${this.inputGitBranch}

` + 'rm -rf ${GOPATH}/src/${GIT_PATH}' + `
` + 'git clone https://github.com/${USER_NAME}/etcd' + ' \\' + `
    ` + '--branch ${BRANCH_NAME}' + ' \\' + `
    ` + '${GOPATH}/src/${GIT_PATH}' + `

` + 'cd ${GOPATH}/src/${GIT_PATH} && ./build' + `

`;

        if (this.inputEtcdExecDirSource === '/') {
            txt += `# sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* /usr/local/bin' + `
`;
        }
        txt += `sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* ' + this.inputEtcdExecDirSource + `

` + this.inputEtcdExecDirSource + divide + `etcd --version
` + this.inputEtcdExecDirSource + divide + `etcdctl --version`;

        return txt;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getCFSSLInitial() {
        let divide = '/';
        if (this.inputCFSSLExecDir === '/') {
            divide = '';
        }

        return `rm -f /tmp/cfssl* && rm -rf /tmp/test-certs && mkdir -p /tmp/test-certs

curl -L https://pkg.cfssl.org/${this.inputCFSSLVersion}/cfssl_linux-amd64 -o /tmp/cfssl
chmod +x /tmp/cfssl
sudo mv /tmp/cfssl ` + this.inputCFSSLExecDir + `/cfssl

curl -L https://pkg.cfssl.org/${this.inputCFSSLVersion}/cfssljson_linux-amd64 -o /tmp/cfssljson
chmod +x /tmp/cfssljson
sudo mv /tmp/cfssljson ` + this.inputCFSSLExecDir + `/cfssljson

` + this.inputCFSSLExecDir + divide + `cfssl version
` + this.inputCFSSLExecDir + divide + `cfssljson -h

mkdir -p $HOME/test-certs/
`;
    }

    getCFSSLRootCA() {
        return `cat > $HOME/test-certs/trusted-ca-csr.json <<EOF
{
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
}
EOF

cfssl gencert --initca=true $HOME/test-certs/trusted-ca-csr.json | cfssljson --bare $HOME/test-certs/trusted-ca

# verify
openssl x509 -in $HOME/test-certs/trusted-ca.pem -text -noout
`;
    }

    getCFSSLConfig() {
        return `cat > $HOME/test-certs/gencert-config.json <<EOF
{
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
}
EOF`;
    }

    getCFSSLKeys(flag: etcdFlag) {
        let hostTxt = `    "localhost"`;
        if (flag.ipAddress !== 'localhost') {
            hostTxt += `,
    "${flag.ipAddress}"`;
        }

        return `cat > $HOME/test-certs/${flag.name}-ca-csr.json <<EOF
{
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
}
EOF

cfssl gencert` + ' \\' + `
    ` + '--ca $HOME/test-certs/trusted-ca.pem' + ' \\' + `
    ` + '--ca-key $HOME/test-certs/trusted-ca-key.pem' + ' \\' + `
    ` + '--config $HOME/test-certs/gencert-config.json' + ' \\' + `
    ` + `$HOME/test-certs/${flag.name}-ca-csr.json | cfssljson --bare $HOME/test-certs/${flag.name}`;
    }


    getCFSSLRootCAResult() {
        return `# CSR configuration
$HOME/test-certs/trusted-ca-csr.json

# CSR
$HOME/test-certs/trusted-ca.csr

# private key
$HOME/test-certs/trusted-ca-key.pem

# public key
$HOME/test-certs/trusted-ca.pem`;
    }

    ggetCFSSLResults() {
        let txt = `# CSR configuration
$HOME/test-certs/trusted-ca-csr.json

# CSR
$HOME/test-certs/trusted-ca.csr

# private key
$HOME/test-certs/trusted-ca-key.pem

# public key
$HOME/test-certs/trusted-ca.pem

`;
        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            txt += `
`;
            txt += '$HOME/test-certs/' + this.etcdFlags[_i].name + '-ca-csr.json' + `
`;
            txt += '$HOME/test-certs/' + this.etcdFlags[_i].name + '.csr' + `
`;
            txt += '$HOME/test-certs/' + this.etcdFlags[_i].name + '-key.pem' + `
`;
            txt += '$HOME/test-certs/' + this.etcdFlags[_i].name + '.pem' + `
`;
            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        return txt;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    getEtcdDataDirCommand(dataDir: string) {
        return `# sudo rm -rf ${dataDir}
sudo mkdir -p ${dataDir}
sudo chown -R root:$(whoami) ${dataDir}
sudo chmod -R a+rw ${dataDir}
`;
    }

    getCFSSLKeysCopyCommand(certsDir: string) {
        return `# after transferring certs to remote machines

# sudo rm -rf ${certsDir}
sudo mkdir -p ${certsDir}
sudo chown -R root:$(whoami) ${certsDir}
sudo chmod -R a+rw ${certsDir}

sudo cp $HOME/test-certs/* ${certsDir}`;
    }

    getSystemdResult(name: string) {
        return `sudo systemctl daemon-reload
sudo systemctl enable ${name}.service
sudo systemctl start ${name}.service

sudo systemctl status ${name}.service -l --no-pager
# sudo journalctl -u ${name}.service -l --no-pager|less
# sudo journalctl -f -u ${name}.service
`;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getEtcdInstallLinux(ver: string, execDir: string) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }

        let txt = `ETCD_VER=${ver}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'rm -rf /tmp/test-etcd-${ETCD_VER} && mkdir -p /tmp/test-etcd-${ETCD_VER}' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd-${ETCD_VER} --strip-components=1' + `

`;
        if (execDir === '/') {
            txt += '# sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* ' + execDir + `

` + execDir + divide + `etcd --version
` + execDir + divide + `etcdctl --version`;

        return txt;
    }

    getEtcdInstallOSX(ver: string, execDir: string) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let txt = `ETCD_VER=${ver}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'rm -rf /tmp/test-etcd-${ETCD_VER}' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp && mv /tmp/etcd-${ETCD_VER}-darwin-amd64 /tmp/test-etcd' + `

`;
        if (execDir === '/') {
            txt += '# sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* ' + execDir + `

` + execDir + divide + `etcd --version
` + execDir + divide + `etcdctl --version`;

        return txt;
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
        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += this.etcdFlags[_i].ipAddress + ':' + String(this.etcdFlags[_i].clientPort);
            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        return txt;
    }

    getAllClientEndpointsWithSchemeList() {
        let eps: string[] = [];
        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            let addr = this.etcdFlags[_i].ipAddress + ':' + String(this.etcdFlags[_i].clientPort);
            let protocol = 'http';
            if (this.inputSecure) {
                protocol = 'https';
            }
            let ep = protocol + '://' + addr;
            eps.push(ep);
            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        return eps;
    }

    getAllClientEndpointsWithSchemeListTxt() {
        let eps = this.getAllClientEndpointsWithSchemeList();
        let txt = '';
        for (let _i = 0; _i < eps.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += eps[_i];
        }
        return txt;
    }

    getInitialCluster() {
        if (this.inputClusterSize > 7) {
            return '(error: cluster size over 7 is not supported)';
        }

        let txt = '';
        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }

            if (this.inputSecure) {
                this.etcdFlags[_i].protocol = 'https';
            } else {
                this.etcdFlags[_i].protocol = 'http';
            }

            txt += this.etcdFlags[_i].name + '=' + this.getPeerURL(this.etcdFlags[_i]);

            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            this.etcdFlags[_i].initialCluster = txt;
        }
        return txt;
    }


    getEtcdAllFlags(dataDir: string, flag: etcdFlag) {
        let txt = '--name' + ' ' + flag.name + ' ' + '--data-dir' + ' ' + dataDir + ' \\' + `
    ` + '--listen-client-urls' + ' ' + this.getClientURL(flag) + ' ' + '--advertise-client-urls' + ' ' + this.getClientURL(flag) + ' \\' + `
    ` + '--listen-peer-urls' + ' ' + this.getPeerURL(flag) + ' ' + '--initial-advertise-peer-urls' + ' ' + this.getPeerURL(flag) + ' \\' + `
    ` + '--initial-cluster' + ' ' + this.getInitialCluster() + ' \\' + `
    ` + '--initial-cluster-token' + ' ' + flag.initialClusterToken + ' ' + '--initial-cluster-state' + ' ' + flag.initialClusterState;

        if (this.inputSecure) {
            txt += ' \\' + `
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
            txt += ' \\' + `
    ` + '--enable-pprof';
        }

        if (this.inputDebug) {
            txt += ' \\' + `
    ` + '--debug';
        }

        if (this.inputAutoCompact > 0) {
            txt += ' \\' + `
    ` + '--auto-compaction-retention' + ' ' + String(this.inputAutoCompact);
        }

        return txt;
    }

    getEtcdFullCommand(execDir: string, dataDir: string, flag: etcdFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let exec = execDir + divide + 'etcd';

        let ds = dataDir;
        if (dataDir.endsWith('/')) {
            ds = dataDir.substring(0, dataDir.length - 1)
        }
        ds = ds + `/${flag.name}.data`;

        return exec + ' ' + this.getEtcdAllFlags(ds, flag);
    }

    getEtcdctlFullCommand(execDir: string, flag: etcdFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let exec = execDir + divide + 'etcdctl';
        let cmd = 'ETCDCTL_API=3 ' + exec + ' \\' + `
    ` + '--endpoints' + ' ' + this.getAllClientEndpoints() + ' \\' + `
    `;
        if (this.inputSecure) {
            cmd += '--cert' + ' ' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + flag.clientKeyFile + ' \\' + `
    ` + '--cacert' + ' ' + flag.clientTrustedCAFile + ' \\' + `
    `;
        }
        cmd += 'endpoint health';
        return cmd;
    }

    getEtcdSystemdServiceFile(execDir: string, etcdDataDir: string, flag: etcdFlag) {
        return `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=etcd
Documentation=https://github.com/coreos/etcd
Conflicts=etcd.service
Conflicts=etcd2.service

[Service]
Restart=always
RestartSec=5s
LimitNOFILE=40000
TimeoutStartSec=0
ExecStart=` + this.getEtcdFullCommand(execDir, etcdDataDir, flag) + `

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getRktInstallLinux(rktVer: string, rktExecDir: string) {
        let divide = '/';
        if (rktExecDir === '/') {
            divide = '';
        }

        let txt = `RKT_VERSION=${rktVer}

GITHUB_URL=https://github.com/coreos/rkt/releases/download

` + 'DOWNLOAD_URL=${GITHUB_URL}' + `

`;

        txt += 'rm -f /tmp/rkt-${RKT_VERSION}.tar.gz' + `
` + 'rm -rf /tmp/test-rkt-${RKT_VERSION} && mkdir -p /tmp/test-rkt-${RKT_VERSION}' + `

` + 'curl -L ${DOWNLOAD_URL}/${RKT_VERSION}/rkt-${RKT_VERSION}.tar.gz -o /tmp/rkt-${RKT_VERSION}.tar.gz' + `
` + 'tar xzvf /tmp/rkt-${RKT_VERSION}.tar.gz -C /tmp/test-rkt-${RKT_VERSION} --strip-components=1' + `

`;
        if (rktExecDir === '/') {
            txt += '# sudo cp /tmp/test-rkt-${RKT_VERSION}/rkt /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-rkt-${RKT_VERSION}/rkt ' + rktExecDir + `

` + rktExecDir + divide + `rkt version`;

        return txt;
    }

    getEtcdRktSystemdServiceFile(rktExecDir: string, etcdDataDir: string, certsDir: string, etcdFlag: etcdFlag, rktFlag: rktFlag) {
        let divideRkt = '/';
        if (rktExecDir === '/') {
            divideRkt = '';
        }
        let execRkt = rktExecDir + divideRkt + 'rkt';

        let ds = etcdDataDir;
        if (etcdDataDir.endsWith('/')) {
            ds = etcdDataDir.substring(0, etcdDataDir.length - 1)
        }
        ds = ds + `/${etcdFlag.name}.data`;

        let vs = this.inputRktVersion.substring(1);
        let cmd = `cat > /tmp/${rktFlag.name}.service <<EOF
[Unit]
Description=etcd with rkt
Documentation=https://github.com/coreos/rkt

[Service]
Restart=always
RestartSec=5s
LimitNOFILE=40000
TimeoutStartSec=0
ExecStart=` + execRkt + ' ' + '--trust-keys-from-https' + ' ' + '--dir=/var/lib/rkt' + ' ' + 'run' + ' \\' + `
    ` + '--stage1-name' + ' ' + 'coreos.com/rkt/stage1-fly:' + vs + ' \\' + `
    ` + '--net=host' + ' \\' + `
    ` + '--volume' + ' ' + 'data-dir,kind=host,source=' + etcdDataDir + ' \\' + `
    ` + '--volume' + ' ' + 'etcd-data-dir,kind=host,readOnly=false,source=' + etcdDataDir + ' \\' + `
    ` + '--mount' + ' ' + 'volume=etcd-data-dir,target=' + etcdDataDir + ' \\' + `
    `;

        if (this.inputSecure) {
            cmd += '--volume' + ' ' + 'etcd-ssl-certs-dir,kind=host,source=' + certsDir + ' \\' + `
    ` + '--mount' + ' ' + 'volume=etcd-ssl-certs-dir,target=' + certsDir + ' \\' + `
    `;
        }

        cmd += 'coreos.com/etcd:' + this.inputEtcdVersionRkt + ' ' + '--' + ' \\' + `
    ` + this.getEtcdAllFlags(ds, etcdFlag) + `

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${rktFlag.name}.service /etc/systemd/system/${rktFlag.name}.service`;

        return cmd;
    }
    ///////////////////////////////////////////////////
}
