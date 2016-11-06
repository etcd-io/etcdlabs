function getDivider(execDir: string) {
    let divider = '/';
    if (execDir === undefined || execDir === '/') {
        divider = '';
    }
    return divider;
}

function cleanDir(dir: string) {
    let ds = dir;
    if (ds === undefined) {
        return '';
    }
    if (ds !== '/' && ds.endsWith('/')) {
        ds = ds.substring(0, ds.length - 1);
    }
    return ds;
}

function getSystemdCommand(service: string) {
    return `sudo systemctl daemon-reload
sudo systemctl enable ${service}.service
sudo systemctl start ${service}.service

sudo systemctl status ${service}.service -l --no-pager
sudo journalctl -u ${service}.service -l --no-pager|less
sudo journalctl -f -u ${service}.service

sudo systemctl stop ${service}.service
sudo systemctl disable ${service}.service`;
}

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

        ipAddress: string,
        clientPort: number,
        peerPort: number,

        initialClusterToken: string,
        initialClusterState: string,
        rootCAPrefix: string,
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
        this.clientTrustedCAFile = rootCAPrefix + '.pem';

        this.peerCertFile = this.name + '.pem';
        this.peerKeyFile = this.name + '-key.pem';
        this.peerTrustedCAFile = rootCAPrefix + '.pem';
    }

    getDataDir() {
        return cleanDir(this.dataDir);
    }

    getCertsDir() {
        return cleanDir(this.certsDir);
    }

    getDataDirPrepareCommand() {
        return `# sudo rm -rf ${this.getDataDir()}
sudo mkdir -p ${this.getDataDir()}
sudo chown -R root:$(whoami) ${this.getDataDir()}
sudo chmod -R a+rw ${this.getDataDir()}
`;
    }

    getCFSSLFilesTxt() {
        let lineBreak = `
`;
        let txt = '';
        txt += this.getCertsDir() + `/` + this.name + '-ca-csr.json' + lineBreak;
        txt += this.getCertsDir() + `/` + this.name + '.csr' + lineBreak;
        txt += this.getCertsDir() + `/` + this.name + '-key.pem' + lineBreak;
        txt += this.getCertsDir() + `/` + this.name + '.pem';
        return txt;
    }

    getClientURL(secure: boolean) {
        let protocol = 'http';
        if (secure) {
            protocol = 'https';
        }
        return protocol + '://' + this.ipAddress + ':' + String(this.clientPort);
    }

    getPeerURL(secure: boolean) {
        let protocol = 'http';
        if (secure) {
            protocol = 'https';
        }
        return protocol + '://' + this.ipAddress + ':' + String(this.peerPort);
    }

    getSystemdCommand() {
        return getSystemdCommand(this.name);
    }
}

const latestReleaseVersion = 'v3.1.0-rc.0';
const flagHelpURL = 'https://github.com/coreos/etcd/blob/master/etcdmain/help.go';

export class Etcd {
    version: string;
    execDir: string;

    // cluster-wise configuration
    secure: boolean;
    enableProfile: boolean;
    debug: boolean;
    autoCompactHour: number;

    clusterSize: number;

    // per-node configuration
    flags: EtcdFlag[];

    constructor(
        version: string,
        execDir: string,

        secure: boolean,
        enableProfile: boolean,
        debug: boolean,
        autoCompactHour: number,

        clusterSize: number,

        flags: EtcdFlag[],
    ) {
        this.version = version;
        this.execDir = execDir;

        this.secure = secure;
        this.enableProfile = enableProfile;
        this.debug = debug;
        this.autoCompactHour = autoCompactHour;

        this.clusterSize = clusterSize;

        this.flags = flags;
    }

    getLatestReleaseVersion() {
        return latestReleaseVersion;
    }

    getFlagHelpURL() {
        return flagHelpURL;
    }

    getExecDir() {
        return cleanDir(this.execDir);
    }

    getCFSSLFilesTxt() {
        let lineBreak = `
`;
        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            txt += this.flags[_i].getCFSSLFilesTxt();
            if (_i + 1 === this.clusterSize) {
                break;
            }
            txt += lineBreak;
        }
        return txt;
    }

    getInstallCommandGitSource(gitUser: string, gitBranch: string) {
        let divide = getDivider(this.getExecDir());

        let txt = 'if [ "${GOPATH}" == "" ]; then' + `
    ` + 'echo "GOPATH does not exist!"' + `
    ` + 'exit 255' + `
` + 'else' + `
    ` + 'echo "GOPATH: ${GOPATH}"' + `
fi

GIT_PATH=github.com/coreos/etcd

USER_NAME=${gitUser}
BRANCH_NAME=${gitBranch}

` + 'rm -rf ${GOPATH}/src/${GIT_PATH}' + `
` + 'git clone https://github.com/${USER_NAME}/etcd' + ' \\' + `
    ` + '--branch ${BRANCH_NAME}' + ' \\' + `
    ` + '${GOPATH}/src/${GIT_PATH}' + `

` + 'cd ${GOPATH}/src/${GIT_PATH} && ./build' + `

`;

        if (this.getExecDir() === '/') {
            txt += `# sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* /usr/local/bin' + `
`;
        }
        txt += `sudo cp ` + '${GOPATH}/src/${GIT_PATH}/bin/etcd* ' + this.getExecDir() + `

` + this.getExecDir() + divide + `etcd --version
` + this.getExecDir() + divide + `etcdctl --version`;

        return txt;
    }

    getInstallCommandLinux() {
        let divide = getDivider(this.getExecDir());

        let txt = `ETCD_VER=${this.version}

GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'rm -rf /tmp/test-etcd-${ETCD_VER} && mkdir -p /tmp/test-etcd-${ETCD_VER}' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd-${ETCD_VER} --strip-components=1' + `

`;
        if (this.getExecDir() === '/') {
            txt += '# sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* ' + this.getExecDir() + `

` + this.getExecDir() + divide + `etcd --version
` + this.getExecDir() + divide + `etcdctl --version`;

        return txt;
    }

    getInstallCommandOSX() {
        let divide = getDivider(this.getExecDir());

        let txt = `ETCD_VER=${this.version}

GITHUB_URL=https://github.com/coreos/etcd/releases/download
GOOGLE_URL=https://storage.googleapis.com/etcd

` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'rm -rf /tmp/test-etcd-${ETCD_VER}' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp && mv /tmp/etcd-${ETCD_VER}-darwin-amd64 /tmp/test-etcd' + `

`;
        if (this.getExecDir() === '/') {
            txt += '# sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd-${ETCD_VER}/etcd* ' + this.getExecDir() + `

` + this.getExecDir() + divide + `etcd --version
` + this.getExecDir() + divide + `etcdctl --version`;

        return txt;
    }

    getClientEndpointsTxt() {
        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += this.flags[_i].ipAddress + ':' + String(this.flags[_i].clientPort);
            if (_i + 1 === this.clusterSize) {
                break;
            }
        }
        return txt;
    }

    getClientEndpointsWithScheme() {
        let eps: string[] = [];
        for (let _i = 0; _i < this.flags.length; _i++) {
            let addr = this.flags[_i].ipAddress + ':' + String(this.flags[_i].clientPort);
            let protocol = 'http';
            if (this.secure) {
                protocol = 'https';
            }
            let ep = protocol + '://' + addr;
            eps.push(ep);
            if (_i + 1 === this.clusterSize) {
                break;
            }
        }
        return eps;
    }

    getClientEndpointsWithSchemeTxt() {
        let eps = this.getClientEndpointsWithScheme();
        let txt = '';
        for (let _i = 0; _i < eps.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += eps[_i];
        }
        return txt;
    }

    getInitialClusterTxt() {
        if (this.clusterSize > 7) {
            return '(error: cluster size over 7 is not supported)';
        }

        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }

            txt += this.flags[_i].name + '=' + this.flags[_i].getPeerURL(this.secure);

            if (_i + 1 === this.clusterSize) {
                break;
            }
        }
        for (let _i = 0; _i < this.flags.length; _i++) {
            this.flags[_i].initialCluster = txt;
        }
        return txt;
    }

    getFlagTxt(flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let flags: string[] = [];
        flags.push('--name' + ' ' + flag.name);

        if (!skipDataDir) {
            flags.push('--data-dir' + ' ' + flag.getDataDir());
        }

        flags.push('--listen-client-urls' + ' ' + flag.getClientURL(this.secure));
        flags.push('--advertise-client-urls' + ' ' + flag.getClientURL(this.secure));
        flags.push('--listen-peer-urls' + ' ' + flag.getPeerURL(this.secure));
        flags.push('--initial-advertise-peer-urls' + ' ' + flag.getPeerURL(this.secure));
        flags.push('--initial-cluster' + ' ' + this.getInitialClusterTxt());
        flags.push('--initial-cluster-token' + ' ' + flag.initialClusterToken);
        flags.push('--initial-cluster-state' + ' ' + flag.initialClusterState);

        if (this.secure) {
            flags.push('--client-cert-auth');
            flags.push('--cert-file' + ' ' + flag.getCertsDir() + '/' + flag.clientCertFile);
            flags.push('--key-file' + ' ' + flag.getCertsDir() + '/' + flag.clientKeyFile);
            flags.push('--trusted-ca-file' + ' ' + flag.getCertsDir() + '/' + flag.clientTrustedCAFile);
            flags.push('--peer-client-cert-auth');
            flags.push('--peer-cert-file' + ' ' + flag.getCertsDir() + '/' + flag.peerCertFile);
            flags.push('--peer-key-file' + ' ' + flag.getCertsDir() + '/' + flag.peerKeyFile);
            flags.push('--peer-trusted-ca-file' + ' ' + flag.getCertsDir() + '/' + flag.peerTrustedCAFile);
        }

        if (this.enableProfile) {
            flags.push('--enable-pprof');
        }

        if (this.debug) {
            flags.push('--debug');
        }

        if (this.autoCompactHour > 0) {
            flags.push('--auto-compaction-retention' + ' ' + String(this.autoCompactHour));
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

    getCommand(flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean) {
        let divide = getDivider(this.getExecDir());
        let exec = this.getExecDir() + divide + 'etcd';
        return exec + ' ' + this.getFlagTxt(flag, skipDataDir, oneLine);
    }

    getEndpointHealthCommand(flag: EtcdFlag) {
        let divide = getDivider(this.getExecDir());
        let exec = this.getExecDir() + divide + 'etcdctl';

        let cmd = 'ETCDCTL_API=3 ' + exec + ' \\' + `
    ` + '--endpoints' + ' ' + this.getClientEndpointsTxt() + ' \\' + `
    `;
        if (this.secure) {
            cmd += '--cert' + ' ' + flag.getCertsDir() + '/' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + flag.getCertsDir() + '/' + flag.clientKeyFile + ' \\' + `
    ` + '--cacert' + ' ' + flag.getCertsDir() + '/' + flag.clientTrustedCAFile + ' \\' + `
    `;
        }
        cmd += 'endpoint health';
        return cmd;
    }

    getServiceFile(flag: EtcdFlag) {
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

ExecStart=` + this.getCommand(flag, false, false) + `

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;
    }

    getServiceFileRkt(rktVer: string, rktExecDir: string, flag: EtcdFlag, customEtcdACI: string) {
        let divideRkt = getDivider(cleanDir(rktExecDir));
        let execRkt = rktExecDir + divideRkt + 'rkt';

        let rktFlags: string[] = [];
        rktFlags.push('--trust-keys-from-https');
        rktFlags.push('--dir=/var/lib/rkt'); // optional '/var/lib/rkt' by default

        let rktRunFlags: string[] = [];
        rktRunFlags.push('run');
        rktRunFlags.push('--stage1-name' + ' ' + 'coreos.com/rkt/stage1-fly:' + rktVer.substring(1));
        rktRunFlags.push('--net=host');
        rktRunFlags.push('--volume' + ' ' + 'data-dir,kind=host,source=' + flag.getDataDir());
        if (this.secure) {
            rktRunFlags.push('--volume' + ' ' + 'etcd-ssl-certs-dir,kind=host,source=' + flag.getCertsDir());
            rktRunFlags.push('--mount' + ' ' + 'volume=etcd-ssl-certs-dir,target=' + flag.getCertsDir());
        }

        if (customEtcdACI !== '') {
            // TODO: https://github.com/coreos/rkt/issues/3346
            rktRunFlags.push('--insecure-options=image');
            rktRunFlags.push(customEtcdACI + ' ' + '--');
        } else {
            rktRunFlags.push('coreos.com/etcd:' + this.version + ' ' + '--');
        }

        let txt = execRkt;
        let lineBreak = ' \\' + `
    `;
        for (let _i = 0; _i < rktFlags.length; _i++) {
            txt += lineBreak + rktFlags[_i];
        }
        for (let _i = 0; _i < rktRunFlags.length; _i++) {
            txt += lineBreak + rktRunFlags[_i];
        }
        txt += lineBreak + this.getFlagTxt(flag, true, false);

        let cmd = `cat > /tmp/${flag.name}.service <<EOF
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

sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service`;

        return cmd;
    }

    // https://github.com/coreos/coreos-overlay/tree/master/app-admin/etcd-wrapper/files
    getServiceFileCoreOS(flag: EtcdFlag) {
        let cmd = `cat > /tmp/override-${flag.name}.conf <<EOF
[Service]
Environment="ETCD_IMAGE_TAG=${this.version}"
Environment="ETCD_DATA_DIR=${flag.getDataDir()}"
Environment="ETCD_SSL_DIR=${flag.getCertsDir()}"
Environment="ETCD_OPTS=${this.getFlagTxt(flag, true, false)}"
EOF

sudo mkdir -p /etc/systemd/system/etcd-member.service.d
sudo mv /tmp/override-${flag.name}.conf /etc/systemd/system/etcd-member.service.d/override.conf
# sudo systemd-delta --type=extended`;

        return cmd;
    }

    getServiceFileCoreOSCommand() {
        return getSystemdCommand('etcd-member');
    }
}
