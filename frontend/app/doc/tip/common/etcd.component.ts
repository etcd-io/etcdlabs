import { Rkt } from './rkt.component';

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

    rkt: Rkt;

    operatorReplicas: number;
    operatorClusterSize: number;
    operatorSnapshotIntervalInSecond: number;
    operatorMaxSnapshot: number;
    operatorBackupVolumeSizeInMB: number;

    constructor(
        version: string,
        execDir: string,

        secure: boolean,
        enableProfile: boolean,
        debug: boolean,
        autoCompactHour: number,

        clusterSize: number,

        flags: EtcdFlag[],

        rkt: Rkt,
    ) {
        this.version = version;
        this.execDir = execDir;

        this.secure = secure;
        this.enableProfile = enableProfile;
        this.debug = debug;
        this.autoCompactHour = autoCompactHour;

        this.clusterSize = clusterSize;

        this.flags = flags;

        this.rkt = rkt;

        this.operatorReplicas = 1;
        this.operatorClusterSize = this.clusterSize;
        this.operatorSnapshotIntervalInSecond = 1800;
        this.operatorMaxSnapshot = 5;
        this.operatorBackupVolumeSizeInMB = 512;
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
` + this.getExecDir() + divide + `etcdctl --version
`;

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
            flags.push('--trusted-ca-file' + ' ' + flag.getCertsDir() + '/' + flag.clientRootCAFile);
            flags.push('--cert-file' + ' ' + flag.getCertsDir() + '/' + flag.clientCertFile);
            flags.push('--key-file' + ' ' + flag.getCertsDir() + '/' + flag.clientKeyFile);

            flags.push('--peer-client-cert-auth');
            flags.push('--peer-trusted-ca-file' + ' ' + flag.getCertsDir() + '/' + flag.peerRootCAFile);
            flags.push('--peer-cert-file' + ' ' + flag.getCertsDir() + '/' + flag.peerCertFile);
            flags.push('--peer-key-file' + ' ' + flag.getCertsDir() + '/' + flag.peerKeyFile);
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
            cmd += '--cacert' + ' ' + flag.getCertsDir() + '/' + flag.clientRootCAFile + ' \\' + `
    ` + '--cert' + ' ' + flag.getCertsDir() + '/' + flag.clientCertFile + ' \\' + `
    ` + '--key' + ' ' + flag.getCertsDir() + '/' + flag.clientKeyFile + ' \\' + `
    `;
        }
        cmd += 'endpoint health';
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

ExecStart=` + this.getCommand(flag, false, false) + `

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service
`;
    }

    getServiceFileRkt(flag: EtcdFlag) {
        let divideRkt = getDivider(this.rkt.getExecDir());
        let execRkt = this.rkt.getExecDir() + divideRkt + 'rkt';

        let rktFlags: string[] = [];

        if (this.rkt.customACI === '') {
            rktFlags.push('--trust-keys-from-https');
        }

        // optional '/var/lib/rkt' is the default
        rktFlags.push('--dir=/var/lib/rkt');

        let rktRunFlags: string[] = [];
        rktRunFlags.push('run');
        rktRunFlags.push('--stage1-name' + ' ' + 'coreos.com/rkt/stage1-fly:' + this.rkt.stripVersion());
        rktRunFlags.push('--net=host');
        rktRunFlags.push('--volume' + ' ' + 'data-dir,kind=host,source=' + flag.getDataDir());
        if (this.secure) {
            rktRunFlags.push('--volume' + ' ' + 'etcd-ssl-certs-dir,kind=host,source=' + flag.getCertsDir());
            rktRunFlags.push('--mount' + ' ' + 'volume=etcd-ssl-certs-dir,target=' + flag.getCertsDir());
        }

        // need 'rkt trust' command
        if (this.rkt.customACI !== '') {
            if (this.rkt.fetchURLPrefixToTrust == '' || this.rkt.publicKeyToTrust == '') {
                rktRunFlags.push('--insecure-options' + ' ' + 'image');
            }
            rktRunFlags.push(this.rkt.customACI + ' ' + '--');
        } else {
            rktRunFlags.push('coreos.com/etcd:' + this.version + ' ' + '--');
        }

        let cmd = '';

        // need 'rkt trust' command
        if (this.rkt.fetchURLPrefixToTrust !== '' && this.rkt.publicKeyToTrust !== '' && this.rkt.customACI !== '') {
            /*
            coreos.com/etcd
            https://pgp.mit.edu/pks/lookup?op=get&search=0x1DDD39C7EB70C24C&options=mr
            https://storage.googleapis.com/etcd/tip/etcd-20161105-ecd4803.aci
            */
            cmd += this.rkt.getTrustCommandLinux() + `

`;
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

        cmd += `# to write service file for etcd with rkt
cat > /tmp/${flag.name}.service <<EOF
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
sudo mv /tmp/${flag.name}.service /etc/systemd/system/${flag.name}.service

`;

        return cmd;
    }

    // https://github.com/coreos/coreos-overlay/tree/master/app-admin/etcd-wrapper/files
    getServiceFileCoreOS(flag: EtcdFlag) {
        let cmd = `# to update etcd-member service file
cat > /tmp/override-${flag.name}.conf <<EOF
[Service]
Environment="ETCD_IMAGE_TAG=${this.version}"
Environment="ETCD_DATA_DIR=${flag.getDataDir()}"
Environment="ETCD_SSL_DIR=${flag.getCertsDir()}"
Environment="ETCD_OPTS=${this.getFlagTxt(flag, true, false)}"
EOF
sudo mkdir -p /etc/systemd/system/etcd-member.service.d
sudo mv /tmp/override-${flag.name}.conf /etc/systemd/system/etcd-member.service.d/override.conf

# to check service-file-override status
sudo systemd-delta --type=extended
`;

        return cmd;
    }

    getServiceFileCoreOSCommand() {
        return getSystemdCommand('etcd-member');
    }

    getOperatorEndpoints() {
        let txt = '';
        for (let _i = 0; _i < this.operatorClusterSize; _i++) {
            txt += 'http://etcd-cluster-000' + String(_i) + ':2379';
            if (_i === this.operatorClusterSize - 1) {
                break;
            }
            txt += ',';
        }
        return txt;
    }

    getOperatorKubectlEndpointHealthCommand() {
        let lineBreak = ' \\' + `
    `;
        let cmd = `# Test with kubectl
kubectl run --rm -i test`;
        cmd += lineBreak + `--image quay.io/coreos/etcd`;
        cmd += lineBreak + `--restart=Never`;
        cmd += '--' + lineBreak + `/bin/sh -c "ETCDCTL_API=3 /usr/local/bin/etcdctl --endpoints=${this.getOperatorEndpoints()} endpoint health"`;
        return cmd;
    }

    getOperatorCommand() {
        return `# make sure Kubernetes API servers are available
kubectl cluster-info


# Deploy etcd-operator
cat > /tmp/etcd-operator-deployment.yaml <<EOF
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: etcd-operator
spec:
  replicas: ${sanitizeNumber(this.operatorReplicas, 1, 3)}
  template:
    metadata:
      labels:
        name: etcd-operator
    spec:
      containers:
      - name: etcd-operator
        image: quay.io/coreos/etcd-operator
        env:
        - name: MY_POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
EOF

kubectl create -f /tmp/etcd-operator-deployment.yaml
kubectl get deployments
kubectl get thirdpartyresources
kubectl get pods



# Create etcd cluster
cat > /tmp/etcd-operator-cluster.yaml <<EOF
apiVersion: coreos.com/v1
kind: EtcdCluster
metadata:
  name: etcd-cluster

spec:
  size: ${sanitizeNumber(this.operatorClusterSize, 1, 7)}
  version: ${this.version}

  backup:
    # interval to save snapshot of etcd, used for disaster recovery
    snapshotIntervalInSecond: ${sanitizeNumber(this.operatorSnapshotIntervalInSecond, 10, 999999)}

    # maximum number of snapshot files to retain; 0 to disable backup (not recommended)
    maxSnapshot: ${sanitizeNumber(this.operatorMaxSnapshot, 0, 999999)}

    # size of volume for persistent disk used for backup
    volumeSizeInMB: ${sanitizeNumber(this.operatorBackupVolumeSizeInMB, 0, 9999999)}
    storageType: PersistentVolume

EOF
kubectl create -f /tmp/etcd-operator-cluster.yaml
kubectl get pods
kubectl get services


${this.getOperatorKubectlEndpointHealthCommand()}

`;
    }
}
