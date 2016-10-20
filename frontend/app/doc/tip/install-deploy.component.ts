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

        this.clientCertFile = this.name + '.pem';
        this.clientKeyFile = this.name + '-key.pem';
        this.clientTrustedCAFile = 'trusted-ca.pem';

        this.peerCertFile = this.name + '.pem';
        this.peerKeyFile = this.name + '-key.pem';
        this.peerTrustedCAFile = 'trusted-ca.pem';
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
    inputEtcdRktExecDir: string;

    inputEtcdDataDirVM: string;
    inputEtcdDataDirSystemd: string;
    inputEtcdDataDirRkt: string;
    inputEtcdDataDirCoreOS: string;

    inputEtcdCertsDirVM: string;
    inputEtcdCertsDirSystemd: string;
    inputEtcdCertsDirRkt: string;
    inputEtcdCertsDirCoreOS: string;
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

    ////////////////////////////////////
    // CoreOS setting properties
    inputEtcdVersionCoreOS: string;
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.inputCFSSLExecDir = '/usr/local/bin';
        this.inputEtcdCertsDir = '/etc/ssl/certs';

        this.inputEtcdExecDirSource = '/';
        this.inputEtcdExecDirVM = '/';
        this.inputEtcdExecDirSystemd = '/';
        this.inputRktExecDir = '/';
        this.inputEtcdRktExecDir = '/';

        this.inputEtcdDataDirVM = '/var/lib/etcd';
        this.inputEtcdDataDirSystemd = '/var/lib/etcd';
        this.inputEtcdDataDirRkt = '/var/lib/etcd';
        this.inputEtcdDataDirCoreOS = '/var/lib/etcd';

        this.inputEtcdCertsDirVM = '/etc/ssl/certs';
        this.inputEtcdCertsDirSystemd = '/etc/ssl/certs';
        this.inputEtcdCertsDirRkt = '/etc/ssl/certs';
        this.inputEtcdCertsDirCoreOS = '/etc/ssl/certs';
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

        ///////////////////////////////////////////////////
        this.inputEtcdVersionCoreOS = this.etcdVersionLatestRelease;
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

    getEtcdBuildFromSource(execDir: string) {
        let divide = '/';
        if (execDir === '/') {
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

        if (execDir === '/') {
            txt += `# sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* /usr/local/bin' + `
`;
        }
        txt += `sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* ' + execDir + `

` + execDir + divide + `etcd --version
` + execDir + divide + `etcdctl --version`;

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

    getEtcdDataDirCommandCoreOS(dataDir: string) {
        return `# sudo rm -rf ${dataDir}
sudo mkdir -p ${dataDir}
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
sudo journalctl -u ${name}.service -l --no-pager|less
sudo journalctl -f -u ${name}.service

sudo systemctl stop ${name}.service
sudo systemctl disable ${name}.service`;
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


    getEtcdAllFlags(dataDir: string, certsDir: string, flag: etcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let flags: string[] = [];
        flags.push('--name' + ' ' + flag.name);

        if (!skipDataDir) {
            flags.push('--data-dir' + ' ' + dataDir);
        }

        flags.push('--listen-client-urls' + ' ' + this.getClientURL(flag));
        flags.push('--advertise-client-urls' + ' ' + this.getClientURL(flag));
        flags.push('--listen-peer-urls' + ' ' + this.getPeerURL(flag));
        flags.push('--initial-advertise-peer-urls' + ' ' + this.getPeerURL(flag));
        flags.push('--initial-cluster' + ' ' + this.getInitialCluster());
        flags.push('--initial-cluster-token' + ' ' + flag.initialClusterToken);
        flags.push('--initial-cluster-state' + ' ' + flag.initialClusterState);

        if (this.inputSecure) {
            flags.push('--client-cert-auth');
            flags.push('--cert-file' + ' ' + certsDir + '/' + flag.clientCertFile);
            flags.push('--key-file' + ' ' + certsDir + '/' + flag.clientKeyFile);
            flags.push('--trusted-ca-file' + ' ' + certsDir + '/' + flag.clientTrustedCAFile);
            flags.push('--peer-client-cert-auth');
            flags.push('--peer-cert-file' + ' ' + certsDir + '/' + flag.peerCertFile);
            flags.push('--peer-key-file' + ' ' + certsDir + '/' + flag.peerKeyFile);
            flags.push('--peer-trusted-ca-file' + ' ' + certsDir + '/' + flag.peerTrustedCAFile);
        }

        if (this.inputEnableProfile) {
            flags.push('--enable-pprof');
        }

        if (this.inputDebug) {
            flags.push('--debug');
        }

        if (this.inputAutoCompact > 0) {
            flags.push('--auto-compaction-retention' + ' ' + String(this.inputAutoCompact));
        }

        let txt = '';
        let lineBreak = ' \\' + `
    `;
        if (oneLine) {
            lineBreak = ' ';
        }
        for (let _i = 0; _i < flags.length; _i++) {
            txt += flags[_i];
            if (_i !== flags.length - 1) {
                txt += lineBreak;
            }
        }
        return txt;
    }

    getEtcdFullCommand(execDir: string, dataDir: string, certsDir: string, flag: etcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let exec = execDir + divide + 'etcd';

        let ds = dataDir;
        if (ds.endsWith('/')) {
            ds = ds.substring(0, ds.length - 1);
        }
        ds = ds + `/${flag.name}.data`;

        let cs = certsDir;
        if (this.inputSecure && cs.endsWith('/')) {
            cs = cs.substring(0, cs.length - 1);
        }

        return exec + ' ' + this.getEtcdAllFlags(ds, cs, flag, skipDataDir, oneLine);
    }

    getEtcdctlFullCommand(execDir: string, certsDir: string, flag: etcdFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let exec = execDir + divide + 'etcdctl';

        let cs = certsDir;
        if (this.inputSecure && cs.endsWith('/')) {
            cs = cs.substring(0, cs.length - 1);
        }

        let cmd = 'ETCDCTL_API=3 ' + exec + ' \\' + `
    ` + '--endpoints' + ' ' + this.getAllClientEndpoints() + ' \\' + `
    `;
        if (this.inputSecure) {
            cmd += '--cert' + ' ' + cs + '/' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + cs + '/' + flag.clientKeyFile + ' \\' + `
    ` + '--cacert' + ' ' + cs + '/' + flag.clientTrustedCAFile + ' \\' + `
    `;
        }
        cmd += 'endpoint health';
        return cmd;
    }

    getEtcdSystemdServiceFile(execDir: string, certsDir: string, etcdDataDir: string, flag: etcdFlag) {
        return `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=etcd
Documentation=https://github.com/coreos/etcd
Conflicts=etcd.service
Conflicts=etcd2.service

[Service]
Type=notify
Restart=always
RestartSec=5s
LimitNOFILE=40000
TimeoutStartSec=0

ExecStart=` + this.getEtcdFullCommand(execDir, certsDir, etcdDataDir, flag, false, false) + `

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

    getEtcdRktSystemdServiceFile(
        rktExecDir: string,
        etcdDataDir: string,
        certsDir: string,
        etcdVer: string,
        etcdFlag: etcdFlag,
        rktVer: string,
        rktFlag: rktFlag
    ) {
        let divideRkt = '/';
        if (rktExecDir === '/') {
            divideRkt = '';
        }
        let execRkt = rktExecDir + divideRkt + 'rkt';

        let ds = etcdDataDir;
        if (ds.endsWith('/')) {
            ds = ds.substring(0, ds.length - 1);
        }
        ds = ds + `/${etcdFlag.name}.data`;

        let cs = certsDir;
        if (this.inputSecure && cs.endsWith('/')) {
            cs = cs.substring(0, cs.length - 1);
        }

        let vs = rktVer.substring(1);
        let cmd = `cat > /tmp/${rktFlag.name}.service <<EOF
[Unit]
Description=etcd with rkt
Documentation=https://github.com/coreos/rkt

[Service]
Type=notify
Restart=always
RestartSec=5s
TimeoutStartSec=0
LimitNOFILE=40000

ExecStart=` + execRkt + ' ' + '--trust-keys-from-https' + ' ' + '--dir=/var/lib/rkt' + ' ' + 'run' + ' \\' + `
    ` + '--stage1-name' + ' ' + 'coreos.com/rkt/stage1-fly:' + vs + ' \\' + `
    ` + '--net=host' + ' \\' + `
    ` + '--volume' + ' ' + 'data-dir,kind=host,source=' + ds;

        if (this.inputSecure) {
            cmd += ' \\' + `
    ` + '--volume' + ' ' + 'etcd-ssl-certs-dir,kind=host,source=' + cs + ' \\' + `
    ` + '--mount' + ' ' + 'volume=etcd-ssl-certs-dir,target=' + cs + ' \\' + `
    `;
        }

        cmd += 'coreos.com/etcd:' + etcdVer + ' ' + '--' + ' \\' + `
    ` + this.getEtcdAllFlags(ds, cs, etcdFlag, true, false) + `

[Install]
WantedBy=multi-user.target
EOF

sudo mkdir -p ${ds}
sudo mv /tmp/${rktFlag.name}.service /etc/systemd/system/${rktFlag.name}.service`;

        return cmd;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    // https://github.com/coreos/coreos-overlay/tree/master/app-admin/etcd-wrapper/files
    getCoreOSEtcdWrapper(etcdDataDir: string, certsDir: string, etcdVer: string, etcdFlag: etcdFlag) {
        let cs = certsDir;
        if (this.inputSecure && cs.endsWith('/')) {
            cs = cs.substring(0, cs.length - 1);
        }

        let cmd = `cat > /tmp/override-${etcdFlag.name}.conf <<EOF
[Service]
Environment="ETCD_IMAGE_TAG=${etcdVer}"
Environment="ETCD_DATA_DIR=${etcdDataDir}"
Environment="ETCD_SSL_DIR=${cs}"
Environment="ETCD_OPTS=${this.getEtcdAllFlags(etcdDataDir, cs, etcdFlag, true, false)}"
EOF

sudo mkdir -p /etc/systemd/system/etcd-member.service.d
sudo mv /tmp/override-${etcdFlag.name}.conf /etc/systemd/system/etcd-member.service.d/override.conf

sudo systemd-delta --type=extended`;

        return cmd;
    }

    getCoreOSEtcdWrapperResult() {
        return `sudo systemctl daemon-reload
sudo systemctl enable etcd-member.service
sudo systemctl start etcd-member.service

sudo systemctl status etcd-member.service -l --no-pager
sudo journalctl -u etcd-member.service -l --no-pager|less
sudo journalctl -f -u etcd-member.service

sudo systemctl stop etcd-member.service
sudo systemctl disable etcd-member.service`;
    }
    ///////////////////////////////////////////////////
}
