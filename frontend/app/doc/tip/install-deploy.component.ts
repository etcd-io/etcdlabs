import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { CFSSL } from './common/cfssl.component';
import { Go } from './common/go.component';
import { Rkt, RktFlag } from './common/rkt.component';

export class EtcdFlag {
    name: string;
    dataDir: string;
    certsDir: string;

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
        certsDir: string,

        inputSecure: boolean,
        ipAddress: string,
        clientPort: number,
        peerPort: number,

        initialClusterToken: string,
        initialClusterState: string
    ) {
        this.name = name;
        this.dataDir = dataDir;

        this.ipAddress = ipAddress;
        this.clientPort = clientPort;
        this.peerPort = peerPort;

        this.initialClusterToken = initialClusterToken;
        this.initialClusterState = initialClusterState;

        this.initialCluster = '';

        this.certsDir = certsDir;

        this.clientCertFile = this.name + '.pem';
        this.clientKeyFile = this.name + '-key.pem';
        this.clientTrustedCAFile = 'trusted-ca.pem';

        this.peerCertFile = this.name + '.pem';
        this.peerKeyFile = this.name + '-key.pem';
        this.peerTrustedCAFile = 'trusted-ca.pem';
    }
}



@Component({
    selector: 'app-install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common/common.component.css'],
})
export class InstallDeployTipComponent extends ParentComponent {
    ////////////////////////////////////
    // TLS setting properties
    cfssl: CFSSL;
    inputCFSSLMoreHostsTxt: string;
    ////////////////////////////////////

    ////////////////////////////////////
    // build etcd from source
    go: Go;
    inputGitUser: string;
    inputGitBranch: string;
    ////////////////////////////////////

    ////////////////////////////////////
    inputEtcdExecDirSource: string;
    inputEtcdExecDirVM: string;
    inputEtcdExecDirSystemd: string;
    inputEtcdRktExecDir: string;
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

    etcdFlags: EtcdFlag[];
    ////////////////////////////////////

    ////////////////////////////////////
    // rkt setting properties
    inputEtcdVersionRkt: string;

    rkt: Rkt;
    rktFlags: RktFlag[];
    ////////////////////////////////////

    ////////////////////////////////////
    // CoreOS setting properties
    inputEtcdVersionCoreOS: string;
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.cfssl = new CFSSL(
            'R1.2',
            '/usr/local/bin',
            '$HOME/test-certs',
            'etcd',
            'etcd, security team',
            'San Francisco',
            'California',
            'USA',
            'rsa',
            4096,
            87600,
            'etcd'
        );
        this.inputCFSSLMoreHostsTxt = '';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.go = new Go('1.7.3');
        this.inputGitUser = 'coreos';
        this.inputGitBranch = 'master';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputEtcdExecDirSource = '/';
        this.inputEtcdExecDirVM = '/';
        this.inputEtcdExecDirSystemd = '/';
        this.inputEtcdRktExecDir = '/';
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
            new EtcdFlag(
                'my-etcd-1',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_1',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-2',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_2',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-3',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_3',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-4',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_4',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-5',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_5',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-6',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_6',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
            new EtcdFlag(
                'my-etcd-7',
                '/var/lib/etcd',
                '/etc/ssl/certs',
                this.inputSecure,
                'TEST_IP_7',
                2379,
                2380,
                'my-etcd-token',
                'new'
            ),
        ];

        ///////////////////////////////////////////////////
        this.inputEtcdVersionRkt = this.etcdVersionLatestRelease;

        this.rkt = new Rkt('v1.18.0', '/');
        this.rktFlags = [
            new RktFlag(
                'my-etcd-rkt-1'
            ),
            new RktFlag(
                'my-etcd-rkt-2'
            ),
            new RktFlag(
                'my-etcd-rkt-3'
            ),
            new RktFlag(
                'my-etcd-rkt-4'
            ),
            new RktFlag(
                'my-etcd-rkt-5'
            ),
            new RktFlag(
                'my-etcd-rkt-6'
            ),
            new RktFlag(
                'my-etcd-rkt-7'
            ),
        ];
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.inputEtcdVersionCoreOS = this.etcdVersionLatestRelease;
        ///////////////////////////////////////////////////
    }

    ///////////////////////////////////////////////////
    getDivider(execDir: string) {
        let divider = '/';
        if (execDir === '/') {
            divider = '';
        }
        return divider;
    }

    cleanDir(dir: string) {
        let ds = dir;
        if (ds === undefined) {
            return '';
        }
        if (ds !== '/' && ds.endsWith('/')) {
            ds = ds.substring(0, ds.length - 1);
        }
        return ds;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    getEtcdBuildFromSource(execDir: string) {
        let divide = this.getDivider(execDir);

        let txt = 'if [ "${GOPATH}" == "" ]; then' + `
    ` + 'echo "GOPATH does not exist!"' + `
    ` + 'exit 255' + `
` + 'else' + `
    ` + 'echo "GOPATH: ${GOPATH}"' + `
fi

GIT_PATH=github.com/coreos/etcd

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
    getCFSSLResults() {
        let txt = this.cfssl.getRootCACommandResult() + `

`;

        for (let _i = 0; _i < this.etcdFlags.length; _i++) {
            txt += `
`;
            txt += this.cfssl.getCertsDir() + `/` + this.etcdFlags[_i].name + '-ca-csr.json' + `
`;
            txt += this.cfssl.getCertsDir() + `/` + this.etcdFlags[_i].name + '.csr' + `
`;
            txt += this.cfssl.getCertsDir() + `/` + this.etcdFlags[_i].name + '-key.pem' + `
`;
            txt += this.cfssl.getCertsDir() + `/` + this.etcdFlags[_i].name + '.pem' + `
`;
            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        return txt;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    getEtcdFlagToDataDirCommand(flag: EtcdFlag) {
        return `# sudo rm -rf ${this.cleanDir(flag.dataDir)}
sudo mkdir -p ${this.cleanDir(flag.dataDir)}
sudo chown -R root:$(whoami) ${this.cleanDir(flag.dataDir)}
sudo chmod -R a+rw ${this.cleanDir(flag.dataDir)}
`;
    }

    getEtcdFlagToDataDirCommandCoreOS(flag: EtcdFlag) {
        return `# sudo rm -rf ${this.cleanDir(flag.dataDir)}
sudo mkdir -p ${this.cleanDir(flag.dataDir)}
`;
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
        let divide = this.getDivider(execDir);

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
        let divide = this.getDivider(execDir);

        let txt = `ETCD_VER=${ver}

GITHUB_URL=https://github.com/coreos/etcd/releases/download
GOOGLE_URL=https://storage.googleapis.com/etcd

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

    getClientURL(flag: EtcdFlag) {
        let protocol = 'http';
        if (this.inputSecure) {
            protocol = 'https';
        }
        return protocol + '://' + flag.ipAddress + ':' + String(flag.clientPort);
    }

    getPeerURL(flag: EtcdFlag) {
        let protocol = 'http';
        if (this.inputSecure) {
            protocol = 'https';
        }
        return protocol + '://' + flag.ipAddress + ':' + String(flag.peerPort);
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


    getEtcdAllFlags(flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let flags: string[] = [];
        flags.push('--name' + ' ' + flag.name);

        if (!skipDataDir) {
            flags.push('--data-dir' + ' ' + flag.dataDir);
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
            flags.push('--cert-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientCertFile);
            flags.push('--key-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientKeyFile);
            flags.push('--trusted-ca-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientTrustedCAFile);
            flags.push('--peer-client-cert-auth');
            flags.push('--peer-cert-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.peerCertFile);
            flags.push('--peer-key-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.peerKeyFile);
            flags.push('--peer-trusted-ca-file' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.peerTrustedCAFile);
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

    getEtcdFullCommand(execDir: string, flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let divide = this.getDivider(execDir);
        let exec = execDir + divide + 'etcd';
        return exec + ' ' + this.getEtcdAllFlags(flag, skipDataDir, oneLine);
    }

    getEtcdctlFullCommand(execDir: string, flag: EtcdFlag) {
        let divide = this.getDivider(execDir);
        let exec = execDir + divide + 'etcdctl';

        let cmd = 'ETCDCTL_API=3 ' + exec + ' \\' + `
    ` + '--endpoints' + ' ' + this.getAllClientEndpoints() + ' \\' + `
    `;
        if (this.inputSecure) {
            cmd += '--cert' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientKeyFile + ' \\' + `
    ` + '--cacert' + ' ' + this.cleanDir(flag.certsDir) + '/' + flag.clientTrustedCAFile + ' \\' + `
    `;
        }
        cmd += 'endpoint health';
        return cmd;
    }

    getEtcdSystemdServiceFile(execDir: string, flag: EtcdFlag) {
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

ExecStart=` + this.getEtcdFullCommand(execDir, flag, false, false) + `

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;
    }
    ///////////////////////////////////////////////////


    ///////////////////////////////////////////////////



    getEtcdRktSystemdServiceFile(
        rktExecDir: string,
        etcdVer: string,
        flag: EtcdFlag,
        rktVer: string,
        rktFlag: RktFlag
    ) {
        let divideRkt = this.getDivider(rktExecDir);
        let execRkt = rktExecDir + divideRkt + 'rkt';

        let rktFlags: string[] = [];
        rktFlags.push('--trust-keys-from-https');
        rktFlags.push('--dir=/var/lib/rkt');

        let vs = rktVer.substring(1);
        let rktRunFlags: string[] = [];
        rktRunFlags.push('--stage1-name' + ' ' + 'coreos.com/rkt/stage1-fly:' + vs);
        rktRunFlags.push('--net=host');
        rktRunFlags.push('--volume' + ' ' + 'data-dir,kind=host,source=' + this.cleanDir(flag.dataDir));
        if (this.inputSecure) {
            rktRunFlags.push('--volume' + ' ' + 'etcd-ssl-certs-dir,kind=host,source=' + this.cleanDir(flag.certsDir));
            rktRunFlags.push('--mount' + ' ' + 'volume=etcd-ssl-certs-dir,target=' + this.cleanDir(flag.certsDir));
        }
        let rktRunImage = 'coreos.com/etcd:' + etcdVer;
        let flags = this.getEtcdAllFlags(flag, true, false);

        let txt = execRkt;
        let lineBreak = ' \\' + `
    `;

        for (let _i = 0; _i < rktFlags.length; _i++) {
            txt += lineBreak + rktFlags[_i];
        }
        txt += lineBreak;
        txt += 'run';
        for (let _i = 0; _i < rktRunFlags.length; _i++) {
            txt += lineBreak + rktRunFlags[_i];
        }
        txt += lineBreak + rktRunImage + ' ' + '--' + lineBreak + flags;

        let cmd = `cat > /tmp/${rktFlag.name}.service <<EOF
[Unit]
Description=etcd with rkt
Documentation=https://github.com/coreos/rkt

[Service]
Restart=always
RestartSec=5s
TimeoutStartSec=0
LimitNOFILE=40000

ExecStart=` + txt + `

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${rktFlag.name}.service /etc/systemd/system/${rktFlag.name}.service`;

        return cmd;
    }
    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    // https://github.com/coreos/coreos-overlay/tree/master/app-admin/etcd-wrapper/files
    getCoreOSEtcdWrapper(etcdVer: string, flag: EtcdFlag) {
        let cmd = `cat > /tmp/override-${flag.name}.conf <<EOF
[Service]
Environment="ETCD_IMAGE_TAG=${etcdVer}"
Environment="ETCD_DATA_DIR=${this.cleanDir(flag.dataDir)}"
Environment="ETCD_SSL_DIR=${this.cleanDir(flag.certsDir)}"
Environment="ETCD_OPTS=${this.getEtcdAllFlags(flag, true, false)}"
EOF

sudo mkdir -p /etc/systemd/system/etcd-member.service.d
sudo mv /tmp/override-${flag.name}.conf /etc/systemd/system/etcd-member.service.d/override.conf

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
