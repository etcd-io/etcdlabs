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

BINS='kubelet kube-apiserver kube-controller-manager kube-scheduler kube-proxy kubectl'` + `

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

` + this.getExecDir() + divide + `kubelet --version
` + this.getExecDir() + divide + `kube-apiserver --version
` + this.getExecDir() + divide + `kube-controller-manager --version
` + this.getExecDir() + divide + `kube-scheduler --version
` + this.getExecDir() + divide + `kube-proxy --version
` + this.getExecDir() + divide + `kubectl version
`;

        return txt;
    }
}
