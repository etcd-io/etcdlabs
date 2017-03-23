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
    if (ds !== '/' && String(ds).endsWith('/')) {
        ds = String(ds).substring(0, ds.length - 1);
    }
    return ds;
}

function sanitizeNumber(num: number, min: number, max: number) {
    let n = num;
    if (n <= min) {
        n = min;
    }
    if (n > max) {
        n = max;
    }
    return n;
}

function getSystemdCommand(service: string) {
    return `# to start service
sudo systemctl daemon-reload
sudo systemctl cat ${service}.service
sudo systemctl enable ${service}.service
sudo systemctl start ${service}.service

# to get logs from service
sudo systemctl status ${service}.service -l --no-pager
sudo journalctl -u ${service}.service -l --no-pager|less
sudo journalctl -f -u ${service}.service

# to stop service
sudo systemctl stop ${service}.service
sudo systemctl disable ${service}.service
`;
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

    clientRootCAFile: string;
    clientCertFile: string;
    clientKeyFile: string;

    peerRootCAFile: string;
    peerCertFile: string;
    peerKeyFile: string;

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

        this.clientRootCAFile = rootCAPrefix + '.pem';
        this.clientCertFile = this.name + '.pem';
        this.clientKeyFile = this.name + '-key.pem';

        this.peerRootCAFile = rootCAPrefix + '.pem';
        this.peerCertFile = this.name + '.pem';
        this.peerKeyFile = this.name + '-key.pem';
    }

    getDataDir() {
        return cleanDir(this.dataDir);
    }

    getCertsDir() {
        return cleanDir(this.certsDir);
    }

    getDataDirPrepareCommand() {
        return `# make sure etcd process has write access to this directory
# remove this directory if the cluster is new; keep if restarting etcd
# sudo rm -rf ${this.getDataDir()}
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

    getListenClientURLs(secure: boolean) {
        let protocol = 'http';
        if (secure) {
            protocol = 'https';
        }
        // let s = '';
        // if (this.ipAddress === 'localhost' || this.ipAddress === '0.0.0.0') {
        //     return protocol + '://' + this.ipAddress + ':' + String(this.clientPort);
        // } else {
        //     if (!docker) {
        //         s += protocol + '://' + '0.0.0.0' + ':' + String(this.clientPort);
        //         s += ',';
        //     }
        // }
        return protocol + '://' + this.ipAddress + ':' + String(this.clientPort);
    }

    getAdvertiseClientURLs(secure: boolean) {
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
            if (_i + 1 === sanitizeNumber(this.clusterSize, 1, 7)) {
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
` + this.getExecDir() + divide + `etcdctl --version

`;
        return txt;
    }

    getInstallCommandLinux() {
        let divide = getDivider(this.getExecDir());

        let txt = `ETCD_VER=${this.version}

# choose either URL
GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download
` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'rm -rf /tmp/test-etcd && mkdir -p /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz' + `
` + 'tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1' + `

`;
        if (this.getExecDir() === '/') {
            txt += '# sudo cp /tmp/test-etcd/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd/etcd* ' + this.getExecDir() + `

` + this.getExecDir() + divide + `etcd --version
` + this.getExecDir() + divide + `etcdctl --version

`;

        return txt;
    }

    getInstallCommandOSX() {
        let divide = getDivider(this.getExecDir());

        let txt = `ETCD_VER=${this.version}

# choose either URL
GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/coreos/etcd/releases/download
` + 'DOWNLOAD_URL=${GOOGLE_URL}' + `

`;

        txt += 'rm -f /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'rm -rf /tmp/test-etcd && mkdir -p /tmp/test-etcd' + `

` + 'curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-darwin-amd64.zip -o /tmp/etcd-${ETCD_VER}-darwin-amd64.zip' + `
` + 'unzip /tmp/etcd-${ETCD_VER}-darwin-amd64.zip -d /tmp' + `
` + 'mv /tmp/etcd-${ETCD_VER}-darwin-amd64/* /tmp/test-etcd' + `

`;
        if (this.getExecDir() === '/') {
            txt += '# sudo cp /tmp/test-etcd/etcd* /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-etcd/etcd* ' + this.getExecDir() + `

` + this.getExecDir() + divide + `etcd --version
` + this.getExecDir() + divide + `etcdctl --version

`;

        return txt;
    }

    getClientEndpointsTxt() {
        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }
            txt += this.flags[_i].ipAddress + ':' + String(this.flags[_i].clientPort);
            if (_i + 1 === sanitizeNumber(this.clusterSize, 1, 7)) {
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
            if (_i + 1 === sanitizeNumber(this.clusterSize, 1, 7)) {
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

            if (_i + 1 === sanitizeNumber(this.clusterSize, 1, 7)) {
                break;
            }
        }
        for (let _i = 0; _i < this.flags.length; _i++) {
            this.flags[_i].initialCluster = txt;
        }
        return txt;
    }

    getFlagTxt(flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean, docker: boolean) {
        let flags: string[] = [];
        flags.push('--name' + ' ' + flag.name);

        let dataDir = flag.getDataDir();
        if (docker) {
            dataDir = '/etcd-data';
        }
        if (!skipDataDir) {
            flags.push('--data-dir' + ' ' + dataDir);
        }

        let certsDir = flag.getCertsDir();
        if (docker) {
            certsDir = '/etcd-ssl-certs-dir';
        }

        flags.push('--listen-client-urls' + ' ' + flag.getListenClientURLs(this.secure));
        flags.push('--advertise-client-urls' + ' ' + flag.getAdvertiseClientURLs(this.secure));
        flags.push('--listen-peer-urls' + ' ' + flag.getPeerURL(this.secure));
        flags.push('--initial-advertise-peer-urls' + ' ' + flag.getPeerURL(this.secure));
        flags.push('--initial-cluster' + ' ' + this.getInitialClusterTxt());
        flags.push('--initial-cluster-token' + ' ' + flag.initialClusterToken);
        flags.push('--initial-cluster-state' + ' ' + flag.initialClusterState);

        if (this.secure) {
            flags.push('--client-cert-auth');
            flags.push('--trusted-ca-file' + ' ' + certsDir + '/' + flag.clientRootCAFile);
            flags.push('--cert-file' + ' ' + certsDir + '/' + flag.clientCertFile);
            flags.push('--key-file' + ' ' + certsDir + '/' + flag.clientKeyFile);

            flags.push('--peer-client-cert-auth');
            flags.push('--peer-trusted-ca-file' + ' ' + certsDir + '/' + flag.peerRootCAFile);
            flags.push('--peer-cert-file' + ' ' + certsDir + '/' + flag.peerCertFile);
            flags.push('--peer-key-file' + ' ' + certsDir + '/' + flag.peerKeyFile);
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

    getCommand(flag: EtcdFlag, skipDataDir: boolean, oneLine: boolean, docker: boolean) {
        let divide = getDivider(this.getExecDir());
        let exec = this.getExecDir() + divide + 'etcd';
        return exec + ' ' + this.getFlagTxt(flag, skipDataDir, oneLine, docker);
    }

    getEndpointHealthCommand(flag: EtcdFlag, docker: boolean) {
        let divide = getDivider(this.getExecDir());
        let exec = this.getExecDir() + divide + 'etcdctl';

        let lineBreak = `
    `;
        let cmd = 'ETCDCTL_API=3 ' + exec + ' \\' + lineBreak + '--endpoints' + ' ' + this.getClientEndpointsTxt() + ' \\' + lineBreak;
        if (this.secure) {
            cmd += '--cacert' + ' ' + flag.getCertsDir() + '/' + flag.clientRootCAFile
            + ' \\' + lineBreak + '--cert' + ' ' + flag.getCertsDir() + '/' + flag.clientCertFile
            + ' \\' + lineBreak + '--key' + ' ' + flag.getCertsDir() + '/' + flag.clientKeyFile
            + ' \\' + lineBreak;
        }
        cmd += 'endpoint health';

        if (docker) {
            // sudo docker exec etcd-v3.1.0 /bin/sh -c "export ETCDCTL_API=3 && /usr/local/bin/etcdctl endpoint health"
            cmd += `


# to use 'docker' command to check the status
`;
            cmd += '/usr/bin/docker' + ' \\' + lineBreak;
            cmd += 'exec' + ' \\' + lineBreak;
            cmd += 'etcd-' + this.version + ' \\' + lineBreak;
            cmd += '/bin/sh' + ' ' + '-c' + ' ';
            cmd += '"';
            cmd += 'export ETCDCTL_API=3';
            cmd += ' && ';
            cmd += '/usr/local/bin/etcdctl';
            cmd += ' ' + '--endpoints' + ' ' + this.getClientEndpointsTxt();
            cmd += ' ';
            if (this.secure) {
                let cs = '/etcd-ssl-certs-dir';
                cmd += '--cacert' + ' ' + cs + '/' + flag.clientRootCAFile;
                cmd += ' ' + '--cert' + ' ' + cs + '/' + flag.clientCertFile;
                cmd += ' ' + '--key' + ' ' + cs + '/' + flag.clientKeyFile;
                cmd += ' ';
            }
            cmd += 'endpoint health';
            cmd += '"' + `

`;
        }

        return cmd;
    }

    getServiceFile(flag: EtcdFlag) {
        return `# to write service file for etcd
cat > /tmp/${flag.name}.service <<EOF
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

ExecStart=` + this.getCommand(flag, false, false, false) + `

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service

`;
    }

    getServiceFileDocker(flag: EtcdFlag) {
        let dockerExec = '/usr/bin';
        let divideDocker = getDivider(dockerExec);
        let execDocker = dockerExec + divideDocker + 'docker';
        let dockerContainerName = 'etcd-' + this.version;

        let dockerRunFlags: string[] = [];
        dockerRunFlags.push('run');
        dockerRunFlags.push('--net=host');
        dockerRunFlags.push('--name' + ' ' + dockerContainerName);
        dockerRunFlags.push('--volume' + '=' + flag.getDataDir() + ':' + '/etcd-data');
        if (this.secure) {
            dockerRunFlags.push('--volume' + '=' + flag.getCertsDir() + ':' + '/etcd-ssl-certs-dir');
        }
        dockerRunFlags.push('quay.io/coreos/etcd:' + this.version);
        dockerRunFlags.push('/usr/local/bin/etcd');

        let execStart = execDocker;
        let lineBreak = ' \\' + `
    `;
        for (let _i = 0; _i < dockerRunFlags.length; _i++) {
            execStart += lineBreak + dockerRunFlags[_i];
        }
        execStart += lineBreak + this.getFlagTxt(flag, false, false, true); // do not skip --data-dir flag for OCI

        // docker stop sends 'SIGTERM'
        // docker kill sends 'SIGKILL'
        let execStop = execDocker + ' ' + 'stop' + ' ' + dockerContainerName;

        // ExecStartPre=/usr/bin/docker` + lineBreak + 'kill' + lineBreak + 'etcd-' + this.version + `
        // ExecStartPre=/usr/bin/docker` + lineBreak + 'rm --force' + lineBreak + 'etcd-' + this.version + `

        let cmd = '';
        cmd += `# to write service file for etcd with Docker
cat > /tmp/${flag.name}.service <<EOF
[Unit]
Description=etcd with Docker
Documentation=https://github.com/coreos/etcd

[Service]
Restart=always
RestartSec=5s
TimeoutStartSec=0
LimitNOFILE=40000

ExecStart=` + execStart + `

ExecStop=` + execStop + `
` + `
[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;

        return cmd;
    }
}
