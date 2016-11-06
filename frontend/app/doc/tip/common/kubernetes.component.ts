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

export class KubernetesInstall {
    version: string;
    goOS: string;
    goARCH: string;
    execDir: string;

    constructor(
        version: string,
        goOS: string,
        goARCH: string,
        execDir: string,
    ) {
        this.version = version;
        this.goOS = goOS;
        this.goARCH = goARCH;
        this.execDir = execDir;
    }

    getExecDir() {
        return cleanDir(this.execDir);
    }

    getCommand() {
        let divide = getDivider(this.getExecDir());

        let txt = `K8S_VER=${this.version}

GOOS=${this.goOS}
GOARCH=${this.goARCH}

DOWNLOAD_URL=https://storage.googleapis.com/kubernetes-release/release

BINS='kube-apiserver kube-controller-manager kube-scheduler kube-proxy kubelet kubectl'` + `

` + 'for K8S_BIN in ${BINS}; do' + `
    echo "Downloading" ` + '${K8S_BIN}' + `
    ` + 'rm -f /tmp/${K8S_BIN}' + `
    ` + 'curl -L ${DOWNLOAD_URL}/${K8S_VER}/bin/${GOOS}/${GOARCH}/${K8S_BIN} -o /tmp/${K8S_BIN}' + `
    ` + 'sudo chmod +x /tmp/${K8S_BIN}' + `
    `;
        if (this.getExecDir() === '/') {
            txt += '# sudo mv /tmp/${K8S_BIN} /usr/local/bin' + `
    `;
        }
        txt += 'sudo mv /tmp/${K8S_BIN} ' + this.getExecDir() + `
done

` + this.getExecDir() + divide + `kube-apiserver --version
` + this.getExecDir() + divide + `kube-controller-manager --version
` + this.getExecDir() + divide + `kube-scheduler --version

` + this.getExecDir() + divide + `kube-proxy --version
` + this.getExecDir() + divide + `kubelet --version

` + this.getExecDir() + divide + `kubectl version
`;

        return txt;
    }
}

// http://kubernetes.io/docs/admin/kube-apiserver/
export class KubernetesAPIServerFlag {
    name: string;

    // --advertise-address
    advertiseAddress: string;

    // --apiserver-count
    apiserverCount: number;

    // --bind-address
    bindAddress: string;

    // --service-cluster-ip-range
    serviceClusterIPRange: string;

    // --service-node-port-range
    serviceNodePortRange: string;

    // --admission-control
    admissionControl: string;

    // --allow-privileged
    allowPrivileged: boolean;

    // --authorization-mode
    authorizationMode: string;

    // --kubelet-certificate-authority
    // --tls-cert-file
    // --tls-private-key-file
    // --service-account-key-file

    // --etcd-cafile
    // --etcd-certfile
    // --etcd-keyfile
    // --etcd-quorum-read
    // --etcd-servers
    // --etcd-prefix "/registry"
    // --storage-backend etcd3

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
