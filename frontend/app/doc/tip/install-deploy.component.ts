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

        this.clientCertFile = '/etc/etcd/' + this.name + '.pem';
        this.clientKeyFile = '/etc/etcd/' + this.name + '-key.pem';
        this.clientTrustedCAFile = '/etc/etcd/trusted-ca.pem';

        this.peerCertFile = '/etc/etcd/' + this.name + '.pem';
        this.peerKeyFile = '/etc/etcd/' + this.name + '-key.pem';
        this.peerTrustedCAFile = '/etc/etcd/trusted-ca.pem';
    }
}

// http://kubernetes.io/docs/admin/kube-apiserver/
export class KubernetesAPIServerFlag {
    name: string;

    admissionControl: string;
    advertiseAddress: string;
    allowPrivileged: boolean;
    apiserverCount: number;
    authorizationMode: string;
    bindAddress: string;

    serviceClusterIPRange: string;
    serviceNodePortRange: string;

    constructor(
        name: string,

        advertiseAddress: string,
        apiserverCount: number,

        serviceClusterIPRange: string,
        serviceNodePortRange: string,
    ) {
        this.name = name;

        this.admissionControl = 'AlwaysAdmit';
        this.advertiseAddress = advertiseAddress;
        this.allowPrivileged = true;
        this.apiserverCount = apiserverCount;
        this.authorizationMode = 'AlwaysAllow';
        this.bindAddress = '0.0.0.0';

        this.serviceClusterIPRange = serviceClusterIPRange;
        this.serviceNodePortRange = serviceNodePortRange;
    }
}

// http://kubernetes.io/docs/admin/kube-controller-manager/
export class KubernetesControllerManagerFlag {
    name: string;

    address: string;
    allocateNodeCIDRs: boolean;
    clusterCIDR: string;
    clusterName: string;

    leaderElect: boolean;
    apiserverMaster: string;

    serviceClusterIPRange: string;

    constructor(
        name: string,

        clusterCIDR: string,
        apiserverMaster: string,

        serviceClusterIPRange: string,
    ) {
        this.name = name;

        this.address = '0.0.0.0';
        this.allocateNodeCIDRs = true;
        this.clusterCIDR = clusterCIDR;
        this.clusterName = this.name;

        this.leaderElect = true;
        this.apiserverMaster = apiserverMaster;

        this.serviceClusterIPRange = serviceClusterIPRange;
    }
}


// http://kubernetes.io/docs/admin/kube-scheduler/
export class KubernetesSchedulerFlag {
    name: string;

    leaderElect: boolean;
    apiserverMaster: string;

    constructor(
        name: string,

        apiserverMaster: string,
    ) {
        this.name = name;

        this.leaderElect = true;
        this.apiserverMaster = apiserverMaster;
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
    inputCertsDir: string;
    inputEtcdExecDirSource: string;
    inputEtcdExecDirVM: string;
    inputEtcdExecDirSystemd: string;
    inputKubernetesExecDir: string;
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
    // Kubernetes setting properties
    inputKubernetesVersion: string;
    inputKubernetesGOOS: string;
    inputKubernetesGOARCH: string;

    kubernetesAPIServerFlags: KubernetesAPIServerFlag[];
    kubernetesControllerManagerFlags: KubernetesControllerManagerFlag[];
    kubernetesSchedulerFlags: KubernetesSchedulerFlag[];
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.inputCFSSLExecDir = '/usr/local/bin';
        this.inputCertsDir = '/etc/etcd';
        this.inputEtcdExecDirSource = '/';
        this.inputEtcdExecDirVM = '/';
        this.inputEtcdExecDirSystemd = '/';
        this.inputKubernetesExecDir = '/';
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
                '/var/lib/etcd/my-etcd-1.data',
                this.inputSecure,
                'localhost',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-2',
                '/var/lib/etcd/my-etcd-2.data',
                this.inputSecure,
                'localhost',
                22379,
                22380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-3',
                '/var/lib/etcd/my-etcd-3.data',
                this.inputSecure,
                'localhost',
                32379,
                32380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-4',
                '/var/lib/etcd/my-etcd-4.data',
                this.inputSecure,
                'localhost',
                4379,
                4380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-5',
                '/var/lib/etcd/my-etcd-5.data',
                this.inputSecure,
                'localhost',
                5379,
                5380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-6',
                '/var/lib/etcd/my-etcd-6.data',
                this.inputSecure,
                'localhost',
                6379,
                6380,
                'my-etcd-token',
                'new'
            ),
            new etcdFlag(
                'my-etcd-7',
                '/var/lib/etcd/my-etcd-7.data',
                this.inputSecure,
                'localhost',
                7379,
                7380,
                'my-etcd-token',
                'new'
            ),
        ];

        this.kubernetesAPIServerFlags = [
            new KubernetesAPIServerFlag(
                'my-kube-apiserver-1',
                '10.240.0.30',
                3,
                '10.3.0.0/24',
                '30000-32767',
            ),
            new KubernetesAPIServerFlag(
                'my-kube-apiserver-2',
                '10.240.0.31',
                3,
                '10.3.0.0/24',
                '30000-32767',
            ),
            new KubernetesAPIServerFlag(
                'my-kube-apiserver-3',
                '10.240.0.32',
                3,
                '10.3.0.0/24',
                '30000-32767',
            ),
        ];

        this.kubernetesControllerManagerFlags = [
            new KubernetesControllerManagerFlag(
                'my-kube-controller-manager-1',
                '10.200.0.0/16',
                'http://10.240.0.30:8080',
                '10.32.0.0/24',
            ),
            new KubernetesControllerManagerFlag(
                'my-kube-controller-manager-2',
                '10.200.0.0/16',
                'http://10.240.0.31:8080',
                '10.32.0.0/24',
            ),
            new KubernetesControllerManagerFlag(
                'my-kube-controller-manager-3',
                '10.200.0.0/16',
                'http://10.240.0.32:8080',
                '10.32.0.0/24',
            ),
        ];

        this.kubernetesSchedulerFlags = [
            new KubernetesSchedulerFlag(
                'my-kube-scheduler-1',
                'http://10.240.0.30:8080',
            ),
            new KubernetesSchedulerFlag(
                'my-kube-scheduler-2',
                'http://10.240.0.31:8080',
            ),
            new KubernetesSchedulerFlag(
                'my-kube-scheduler-3',
                'http://10.240.0.32:8080',
            ),
        ];
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputKubernetesVersion = 'v1.5.0-alpha.1';
        this.inputKubernetesGOOS = 'linux';
        this.inputKubernetesGOARCH = 'amd64';
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

    getEtcdCommandBuildFromSource() {
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
    getCFSSLCommandInitial() {
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

    getCFSSLCommandRootCA() {
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

    getCFSSLCommandConfig() {
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

    getCFSSLCommandKeys(flag: etcdFlag) {
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


    getCFSSLCommandRootCAResult() {
        return `# CSR configuration
$HOME/test-certs/trusted-ca-csr.json

# CSR
$HOME/test-certs/trusted-ca.csr

# private key
$HOME/test-certs/trusted-ca-key.pem

# public key
$HOME/test-certs/trusted-ca.pem`;
    }

    ggetCFSSLCommandResults() {
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

    getCFSSLCommandKeysCopyGCP() {
        return `# after transferring files to remote machines

# sudo rm -rf ` + this.inputCertsDir + `
sudo mkdir -p ` + this.inputCertsDir + `
sudo chown -R root:$(whoami) ` + this.inputCertsDir + `
sudo chmod -R a+rw ` + this.inputCertsDir + `

sudo cp $HOME/test-certs/* ` + this.inputCertsDir;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getEtcdCommandVMInstallLinux() {
        let divide = '/';
        if (this.inputEtcdExecDirVM === '/') {
            divide = '';
        }

        let txt = `ETCD_VER=${this.inputEtcdVersionVM}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz && rm -rf /tmp/test-etcd && mkdir -p /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1' + `

`;
        if (this.inputEtcdExecDirVM === '/') {
            txt += `# sudo cp /tmp/test-etcd/etcd* /usr/local/bin` + `
`;
        }
        txt += `sudo cp /tmp/test-etcd/etcd* ` + this.inputEtcdExecDirVM + `

` + this.inputEtcdExecDirVM + divide + `etcd --version
` + this.inputEtcdExecDirVM + divide + `etcdctl --version`;

        return txt;
    }

    getEtcdCommandSystemdInstallLinux() {
        let divide = '/';
        if (this.inputEtcdExecDirSystemd === '/') {
            divide = '';
        }

        let txt = `ETCD_VER=${this.inputEtcdVersionSystemd}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz && rm -rf /tmp/test-etcd && mkdir -p /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1' + `

`;
        if (this.inputEtcdExecDirSystemd === '/') {
            txt += `# sudo cp /tmp/test-etcd/etcd* /usr/local/bin` + `
`;
        }
        txt += `sudo cp /tmp/test-etcd/etcd* ` + this.inputEtcdExecDirSystemd + `

` + this.inputEtcdExecDirSystemd + divide + `etcd --version
` + this.inputEtcdExecDirSystemd + divide + `etcdctl --version`;

        return txt;
    }

    getEtcdCommandVMInstallOSX() {
        let divide = '/';
        if (this.inputEtcdExecDirVM === '/') {
            divide = '';
        }
        let txt = `ETCD_VER=${this.inputEtcdVersionVM}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip && rm -rf /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp && mv /tmp/etcd-${ETCD_VER}-darwin-amd64 /tmp/test-etcd' + `

`;
        if (this.inputEtcdExecDirVM === '/') {
            txt += `# sudo cp /tmp/test-etcd/etcd* /usr/local/bin` + `
`;
        }
        txt += `sudo cp /tmp/test-etcd/etcd* ` + this.inputEtcdExecDirVM + `

` + this.inputEtcdExecDirVM + divide + `etcd --version
` + this.inputEtcdExecDirVM + divide + `etcdctl --version`;

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

    getEtcdCommandVMBash(execDir: string, flag: etcdFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }
        let exec = execDir + divide + 'etcd';
        let cmd = exec + ' ' + '--name' + ' ' + flag.name + ' ' + '--data-dir' + ' ' + flag.dataDir + ' \\' + `
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

        if (this.inputAutoCompact > 0) {
            cmd += ' \\' + `
    ` + '--auto-compaction-retention' + ' ' + String(this.inputAutoCompact);
        }

        return cmd;
    }

    getEtcdctlCommandVMBash(execDir: string, flag: etcdFlag) {
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


    getEtcdCommandVMCreateDir() {
        return `# sudo rm -rf /var/lib/etcd
sudo mkdir -p /var/lib/etcd
sudo chown -R root:$(whoami) /var/lib/etcd
sudo chmod -R a+rw /var/lib/etcd
`;
    }

    getEtcdCommandSystemdServiceFile(execDir: string, flag: etcdFlag) {
        return `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=etcd
Documentation=https://github.com/coreos/etcd

[Service]
ExecStart=` + this.getEtcdCommandVMBash(execDir, flag) + `
Restart=always
RestartSec=5
LimitNOFILE=40000

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;
    }

    getEtcdCommandSystemdServiceFileResult(flag: etcdFlag) {
        return `sudo systemctl daemon-reload
sudo systemctl enable ${flag.name}.service
sudo systemctl start ${flag.name}.service

sudo systemctl status ${flag.name}.service -l --no-pager
# sudo journalctl -u ${flag.name}.service -l --no-pager|less
# sudo journalctl -f -u ${flag.name}.service
`;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////
    getKubernetesCommandInstall() {
        let divide = '/';
        if (this.inputKubernetesExecDir === '/') {
            divide = '';
        }
        let txt = `K8S_VER=${this.inputKubernetesVersion}

GOOS=${this.inputKubernetesGOOS}
GOARCH=${this.inputKubernetesGOARCH}

DOWNLOAD_URL=https://storage.googleapis.com/kubernetes-release/release

for K8S_BIN in kube-apiserver kube-controller-manager kube-scheduler kube-proxy kubelet kubectl; do
    echo "Downloading" ` + '${K8S_BIN}' + `
    ` + 'rm -f /tmp/${K8S_BIN}' + `
    ` + 'curl -L ${DOWNLOAD_URL}/${K8S_VER}/bin/${GOOS}/${GOARCH}/${K8S_BIN} -o /tmp/${K8S_BIN}' + `
    ` + 'sudo chmod +x /tmp/${K8S_BIN}' + `
    `;
        if (this.inputKubernetesExecDir === '/') {
            txt += '# sudo mv /tmp/${K8S_BIN} /usr/local/bin' + `
    `;
        }
        txt += 'sudo mv /tmp/${K8S_BIN} ' + this.inputKubernetesExecDir + `
done


` + this.inputKubernetesExecDir + divide + `kube-apiserver --version
` + this.inputKubernetesExecDir + divide + `kube-controller-manager --version
` + this.inputKubernetesExecDir + divide + `kube-scheduler --version

` + this.inputKubernetesExecDir + divide + `kube-proxy --version
` + this.inputKubernetesExecDir + divide + `kubelet --version

` + this.inputKubernetesExecDir + divide + `kubectl version
`;

        return txt;
    }

    getKubernetesAPIServerSystemdServiceFile(execDir: string, flag: KubernetesAPIServerFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }

        let txt = `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=Kubernetes API Server
Documentation=http://kubernetes.io/docs/admin/kube-apiserver/

[Service]
ExecStart=` + execDir + divide + 'kube-apiserver' + ' \\' + `
    ` + '--admission-control' + ' ' + flag.admissionControl + ' \\' + `
    ` + '--advertise-address' + ' ' + flag.advertiseAddress + ' \\' + `
    `;

        if (flag.allowPrivileged) {
            txt += '--allow-privileged' + ' \\' + `
    `;
        }

        txt += '--apiserver-count' + ' ' + String(flag.apiserverCount) + ' \\' + `
    ` + '--authorization-mode' + ' ' + flag.authorizationMode + ' \\' + `
    ` + '--bind-address' + ' ' + flag.bindAddress + ' \\' + `
    ` + '--insecure-bind-address' + ' ' + '0.0.0.0' + ' \\' + `
    ` + '--etcd-cafile' + ' ' + this.etcdFlags[0].clientTrustedCAFile + ' \\' + `
    ` + '--etcd-certfile' + ' ' + this.etcdFlags[0].clientCertFile + ' \\' + `
    ` + '--etcd-keyfile' + ' ' + this.etcdFlags[0].clientKeyFile + ' \\' + `
    ` + '--etcd-quorum-read' + ' \\' + `
    ` + '--etcd-servers' + ' ' + this.getAllClientEndpointsWithSchemeListTxt() + ' \\' + `
    ` + '--storage-backend' + ' ' + 'etcd3' + ' \\' + `
    ` + '--service-cluster-ip-range' + ' ' + flag.serviceClusterIPRange + ' \\' + `
    ` + '--service-node-port-range' + ' ' + flag.serviceNodePortRange + ' \\' + `
    ` + '--tls-cert-file' + ' ' + this.etcdFlags[0].clientCertFile + ' \\' + `
    ` + '--tls-private-key-file' + ' ' + this.etcdFlags[0].clientKeyFile;

        txt += `
Restart=always
RestartSec=5
LimitNOFILE=40000

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;

        return txt;
    }
    getKubernetesAPIServerSystemdServiceFileResult(flag: KubernetesAPIServerFlag) {
        return `sudo systemctl daemon-reload
sudo systemctl enable ${flag.name}.service
sudo systemctl start ${flag.name}.service

sudo systemctl status ${flag.name}.service -l --no-pager
# sudo journalctl -u ${flag.name}.service -l --no-pager|less
# sudo journalctl -f -u ${flag.name}.service
`;
    }

    getKubernetesControllerManagerSystemdServiceFile(execDir: string, flag: KubernetesControllerManagerFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }

        let txt = `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=Kubernetes Controller Manager
Documentation=http://kubernetes.io/docs/admin/kube-controller-manager/

[Service]
ExecStart=` + execDir + divide + 'kube-controller-manager' + ' \\' + `
    ` + '--address' + ' ' + flag.address + ' \\' + `
    `;

        if (flag.allocateNodeCIDRs) {
            txt += '--allocate-node-cidrs' + ' \\' + `
    `;
        }

        txt += '--cluster-cidr' + ' ' + flag.clusterCIDR + ' \\' + `
    ` + '--cluster-name' + ' ' + flag.clusterName + ' \\' + `
    `;

        if (flag.leaderElect) {
            txt += '--leader-elect' + ' \\' + `
    `;
        }

        txt += '--master' + ' ' + flag.apiserverMaster + ' \\' + `
    ` + '--root-ca-file' + ' ' + this.etcdFlags[0].clientTrustedCAFile + ' \\' + `
    ` + '--service-account-private-key-file' + ' ' + this.etcdFlags[0].clientKeyFile + ' \\' + `
    ` + '--service-cluster-ip-range' + ' ' + flag.serviceClusterIPRange;

        txt += `
Restart=always
RestartSec=5
LimitNOFILE=40000

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;

        return txt;
    }
    getKubernetesControllerManagerSystemdServiceFileResult(flag: KubernetesControllerManagerFlag) {
        return `sudo systemctl daemon-reload
sudo systemctl enable ${flag.name}.service
sudo systemctl start ${flag.name}.service

sudo systemctl status ${flag.name}.service -l --no-pager
# sudo journalctl -u ${flag.name}.service -l --no-pager|less
# sudo journalctl -f -u ${flag.name}.service
`;
    }


    getKubernetesSchedulerSystemdServiceFile(execDir: string, flag: KubernetesSchedulerFlag) {
        let divide = '/';
        if (execDir === '/') {
            divide = '';
        }

        let txt = `cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=Kubernetes Scheduler
Documentation=http://kubernetes.io/docs/admin/kube-scheduler/

[Service]
ExecStart=` + execDir + divide + 'kube-scheduler' + ' \\' + `
    `;

        if (flag.leaderElect) {
            txt += '--leader-elect' + ' \\' + `
    `;
        }

        txt += '--master' + ' ' + flag.apiserverMaster;

        txt += `
Restart=always
RestartSec=5
LimitNOFILE=40000

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;

        return txt;
    }
    getKubernetesSchedulerSystemdServiceFileResult(flag: KubernetesSchedulerFlag) {
        return `sudo systemctl daemon-reload
sudo systemctl enable ${flag.name}.service
sudo systemctl start ${flag.name}.service

sudo systemctl status ${flag.name}.service -l --no-pager
# sudo journalctl -u ${flag.name}.service -l --no-pager|less
# sudo journalctl -f -u ${flag.name}.service
`;
    }
    ///////////////////////////////////////////////////
}
