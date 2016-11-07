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

function getLines(txt: string) {
    let lines: string[] = [];
    if (String(txt) !== '') {
        let ls = String(txt).split(/\r?\n/);
        for (let _i = 0; _i < ls.length; _i++) {
            if (ls[_i] !== '') {
                lines.push(ls[_i]);
            }
        }
    }
    return lines;
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

export class Calico {
    etcdEndpointsTxt: string;
    advertiseIP: string;
    apiServerPort: number;

    constructor(
        etcdEndpointsTxt: string,
        advertiseIP: string,
        apiServerPort: number,
    ) {
        this.etcdEndpointsTxt = etcdEndpointsTxt;
        this.advertiseIP = advertiseIP;
        this.apiServerPort = apiServerPort;
    }

    getRktOpts() {
        let fs: string[] = [];
        fs.push('--trust-keys-from-https');
        fs.push('run');
        fs.push('--inherit-env');
        fs.push('--stage1-from-dir=stage1-fly.aci');
        fs.push('--volume=modules,kind=host,source=/lib/modules,readOnly=false');
        fs.push('--mount=volume=modules,target=/lib/modules');
        fs.push('--volume=dns,kind=host,source=/etc/resolv.conf,readOnly=true');
        fs.push('--mount=volume=dns,target=/etc/resolv.conf');
        fs.push('quay.io/calico/node:v0.19.0');
        return fs;
    }

    getRktOptsTxt(lineBreak: string) {
        let fs = this.getRktOpts();
        let txt = '';
        for (let _i = 0; _i < fs.length; _i++) {
            txt += fs[_i];
            if (_i + 1 === fs.length) {
                break;
            }
            txt += lineBreak;
        }
        return txt;
    }

    getServiceFile() {
        let serviceFileLineBreak = ` \\
    `;
        return `# /etc/systemd/system/calico-node.service
cat > /tmp/calico-node.service <<EOF
[Unit]
Description=Calico per-host agent
Requires=network-online.target
After=network-online.target

[Service]
Slice=machine.slice
Environment=CALICO_DISABLE_FILE_LOGGING=true
Environment=HOSTNAME=${this.advertiseIP}
Environment=IP=${this.advertiseIP}
Environment=FELIX_FELIXHOSTNAME=${this.advertiseIP}
Environment=CALICO_NETWORKING=false
Environment=NO_DEFAULT_POOLS=true
Environment=ETCD_ENDPOINTS=${this.etcdEndpointsTxt}
ExecStart=/usr/bin/rkt ${this.getRktOptsTxt(serviceFileLineBreak)}

KillMode=mixed
Restart=always
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/calico-node.service /etc/systemd/system/calico-node.service

${getSystemdCommand('calico-node')}
`;
    }

    getPolicyFile() {
        return `# /etc/kubernetes/manifests/policy-controller.yaml
cat > /tmp/policy-controller.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: calico-policy-controller
  namespace: calico-system
spec:
  hostNetwork: true
  containers:
    # The Calico policy controller.
    - name: k8s-policy-controller
      image: calico/kube-policy-controller:v0.2.0
      env:
        - name: ETCD_ENDPOINTS
          value: "${this.etcdEndpointsTxt}"
        - name: K8S_API
          value: "http://127.0.0.1:${this.apiServerPort}"
        - name: LEADER_ELECTION
          value: "true"
    # Leader election container used by the policy controller.
    - name: leader-elector
      image: quay.io/calico/leader-elector:v0.1.0
      imagePullPolicy: IfNotPresent
      args:
        - "--election=calico-policy-election"
        - "--election-namespace=calico-system"
        - "--http=127.0.0.1:4040"
EOF
sudo mv /tmp/policy-controller.yaml /etc/kubernetes/manifests/policy-controller.yaml

`;
    }

    getCNIConfig() {
        return `# /etc/kubernetes/cni/net.d/10-calico.conf
cat > /tmp/10-calico.conf <<EOF
{
    "name": "calico",
    "type": "flannel",
    "delegate": {
        "type": "calico",
        "etcd_endpoints": "${this.etcdEndpointsTxt}",
        "log_level": "none",
        "log_level_stderr": "info",
        "hostname": "${this.advertiseIP}",
        "policy": {
            "type": "k8s",
            "k8s_api_root": "http://127.0.0.1:${this.apiServerPort}/api/v1/"
        }
    }
}
EOF
sudo mv /tmp/10-calico.conf /etc/kubernetes/cni/net.d/10-calico.conf
`;
    }

    get() {
return `${this.getServiceFile()}
${this.getPolicyFile()}
${this.getCNIConfig()}`;
    }
}

export class KubeAPIServerFlag {
    // --advertise-address
    ipAddress: string;
    port: number;

    constructor(
        ipAddress: string,
        port: number,
    ) {
        this.ipAddress = ipAddress;
        this.port = port;
    }

    getAddressWithScheme() {
        return 'https://' + this.ipAddress + ':' + String(this.port);
    }
}

// KubeletConfig defines kubelet configuration.
//
// http://kubernetes.io/docs/admin/kubelet/
// https://coreos.com/kubernetes/docs/latest/deploy-master.html
export class KubeletConfig {
    // --register-schedulable
    registerSchedulable: boolean;

    // --api-servers
    apiServersTxt: string;

    certsDir: string;

    // --tls-cert-file
    tlsCertFile: string;

    // --tls-private-key-file
    tlsPrivateKeyFile: string;

    // --allow-privileged
    allowPrivileged: boolean;

    // --container-runtime
    containerRuntime: string;

    // --rkt-path
    rktPath: string;

    // --network-plugin
    networkPlugin: string;

    // --network-plugin-dir
    networkPluginDir: string;

    // --config
    config: string;

    // --hostname-override
    hostnameOverride: string;

    // --cluster-dns
    dnsServiceIP: string;

    // --cluster-domain
    clusterDomain: string;

    constructor(
        registerSchedulable: boolean,
        apiServersTxt: string,
        certsDir: string,
        tlsCertFile: string,
        tlsPrivateKeyFile: string,
        advertiseIP: string,
        dnsServiceIP: string,
    ) {
        this.registerSchedulable = registerSchedulable;
        this.apiServersTxt = apiServersTxt;

        this.certsDir = certsDir;
        this.tlsCertFile = tlsCertFile;
        this.tlsPrivateKeyFile = tlsPrivateKeyFile;

        this.allowPrivileged = true;

        this.containerRuntime = 'rkt';
        this.rktPath = '/usr/bin/rkt';

        this.networkPlugin = 'cni';
        this.networkPluginDir = '/etc/kubernetes/cni/net.d';

        this.config = '/etc/kubernetes/manifests';

        this.hostnameOverride = advertiseIP;
        this.dnsServiceIP = dnsServiceIP;

        this.clusterDomain = 'cluster.local';
    };

    getRktOpts() {
        let fs: string[] = [];
        fs.push('--volume=var-log,kind=host,source=/var/log');
        fs.push('--mount=volume=var-log,target=/var/log');
        fs.push('--volume=dns,kind=host,source=/etc/resolv.conf');
        fs.push('--mount=volume=dns,target=/etc/resolv.conf');
        return fs;
    }

    getRktOptsTxt(lineBreak: string) {
        let fs = this.getRktOpts();
        let txt = '';
        for (let _i = 0; _i < fs.length; _i++) {
            txt += fs[_i];
            if (_i + 1 === fs.length) {
                break;
            }
            txt += lineBreak;
        }
        return txt;
    }

    getFlags() {
        let fs: string[] = [];
        if (this.registerSchedulable) {
            fs.push('--register-schedulable' + '=' + 'true');
        } else {
            fs.push('--register-schedulable' + '=' + 'false');
        }

        fs.push('--api-servers' + '=' + this.apiServersTxt);

        let divider = getDivider(this.certsDir);
        let ds = cleanDir(this.certsDir) + divider;

        fs.push('--tls-cert-file' + '=' + ds + this.tlsCertFile);
        fs.push('--tls-private-key-file' + '=' + ds + this.tlsPrivateKeyFile);

        if (this.allowPrivileged) {
            fs.push('--allow-privileged' + '=' + 'true');
        } else {
            fs.push('--allow-privileged' + '=' + 'false');
        }

        fs.push('--container-runtime' + '=' + this.containerRuntime);
        fs.push('--rkt-path' + '=' + this.rktPath);
        fs.push('--network-plugin' + '=' + this.networkPlugin);
        fs.push('--network-plugin-dir' + '=' + this.networkPluginDir);
        fs.push('--config' + '=' + this.config);
        fs.push('--hostname-override' + '=' + this.hostnameOverride);
        fs.push('--cluster-dns' + '=' + this.dnsServiceIP);
        fs.push('--cluster-domain' + '=' + this.clusterDomain);

        return fs;
    }

    getFlagsTxt(lineBreak: string) {
        let fs = this.getFlags();
        let txt = '';
        for (let _i = 0; _i < fs.length; _i++) {
            txt += fs[_i];
            if (_i + 1 === fs.length) {
                break;
            }
            txt += lineBreak;
        }
        return txt;
    }
}

// http://kubernetes.io/docs/admin/kube-apiserver/
export class KubeAPIServer {
    // quay.io/coreos/hyperkube
    version: string;

    // --etcd-cafile
    etcdCAFile: string;

    // --etcd-certfile
    etcdCertFile: string;

    // --etcd-keyfile
    etcdKeyFile: string;

    // --etcd-quorum-read
    etcdQuorumRead: boolean;

    // --etcd-servers
    etcdServersTxt: string;

    // --etcd-prefix "/registry"
    etcdPrefix: string;

    // --storage-backend etcd3
    storageBackend: string;

    // --apiserver-count
    apiserverCount: number;

    // --bind-address
    bindAddress: string;

    // --secure-port
    securePort: number;

    // --client-ca-file
    clientCAFile: string;

    // --tls-cert-file
    tlsCertFile: string;

    // --tls-private-key-file
    tlsPrivateKeyFile: string;

    // --kubelet-certificate-authority
    // --kubelet-client-certificate
    // --kubelet-client-key
    // --kubelet-https

    // --allow-privileged
    allowPrivileged: boolean;

    // --admission-control
    admissionControl: string;

    // --service-cluster-ip-range
    serviceClusterIPRange: string;
    dnsServiceIP: string;

    // --runtime-config
    runtimeConfig: string;

    flags: KubeAPIServerFlag[];

    constructor(
        version: string,
        apiserverCount: number,
        serviceClusterIPRange: string,
        dnsServiceIP: string,
        flags: KubeAPIServerFlag[],
    ) {
        this.version = version;

        this.etcdCAFile = 'etcd-root-ca.pem';
        this.etcdCertFile = 'my-etcd-1.pem';
        this.etcdKeyFile = 'my-etcd-1-key.pem';
        this.etcdQuorumRead = true;
        this.etcdServersTxt = `https://10.240.0.35:2379
https://10.240.0.36:2379
https://10.240.0.37:2379
`;
        this.etcdPrefix = '/registry';
        this.storageBackend = 'etcd3';

        this.apiserverCount = apiserverCount;
        this.bindAddress = '0.0.0.0';

        this.securePort = 443;

        this.clientCAFile = 'kube-root-ca.pem';
        this.tlsCertFile = 'kube-apiserver.pem';
        this.tlsPrivateKeyFile = 'kube-apiserver-key.pem';

        this.allowPrivileged = true;
        this.admissionControl = 'NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,ResourceQuota';

        this.serviceClusterIPRange = serviceClusterIPRange;
        this.dnsServiceIP = dnsServiceIP;

        this.runtimeConfig = 'extensions/v1beta1=true,extensions/v1beta1/networkpolicies=true';

        this.flags = flags;
    }

    getEtcdServers() {
        return getLines(this.etcdServersTxt);
    }

    getEtcdServersTxt() {
        let txt = '';
        let hosts = this.getEtcdServers();
        for (let _i = 0; _i < hosts.length; _i++) {
            txt += hosts[_i];
            if (_i + 1 === sanitizeNumber(hosts.length, 1, 7)) {
                break;
            }
            txt += ',';
        }
        return txt;
    }

    getAPIServerIPs() {
        let ips: string[] = [];
        for (let _i = 0; _i < this.flags.length; _i++) {
            ips.push(this.flags[_i].ipAddress);
            if (_i + 1 === sanitizeNumber(this.apiserverCount, 1, 3)) {
                break;
            }
        }
        return ips;
    }

    getAPIServerIPsTxt() {
        let txt = '';
        let ips = this.getAPIServerIPs();
        for (let _i = 0; _i < ips.length; _i++) {
            txt += ips[_i];
            if (_i + 1 === sanitizeNumber(this.apiserverCount, 1, 3)) {
                break;
            }
            txt += ',';
        }
        return txt;
    }

    getAPIServers() {
        let hosts: string[] = [];
        for (let _i = 0; _i < this.flags.length; _i++) {
            hosts.push(this.flags[_i].getAddressWithScheme());
            if (_i + 1 === sanitizeNumber(this.apiserverCount, 1, 3)) {
                break;
            }
        }
        return hosts;
    }

    getAPIServersTxt() {
        let txt = '';
        let hosts = this.getAPIServers();
        for (let _i = 0; _i < hosts.length; _i++) {
            txt += hosts[_i];
            if (_i + 1 === sanitizeNumber(this.apiserverCount, 1, 3)) {
                break;
            }
            txt += ',';
        }
        return txt;
    }

    getFlags(certsDir: string, flag: KubeAPIServerFlag) {
        let fs: string[] = [];

        let divider = getDivider(certsDir);
        let dir = cleanDir(certsDir);
        let ds = dir + divider;

        fs.push('--etcd-cafile' + '=' + ds + this.etcdCAFile);
        fs.push('--etcd-certfile' + '=' + ds + this.etcdCertFile);
        fs.push('--etcd-keyfile' + '=' + ds + this.etcdKeyFile);
        if (this.etcdQuorumRead) {
            fs.push('--etcd-quorum-read' + '=' + 'true');
        } else {
            fs.push('--etcd-quorum-read' + '=' + 'false');
        }
        fs.push('--etcd-servers' + '=' + this.getEtcdServersTxt());
        fs.push('--etcd-prefix' + '=' + '/registry');
        fs.push('--storage-backend' + '=' + 'etcd3');

        fs.push('--apiserver-count' + '=' + String(sanitizeNumber(this.apiserverCount, 1, 3)));
        fs.push('--bind-address' + '=' + this.bindAddress);
        fs.push('--advertise-address' + '=' + flag.ipAddress);

        fs.push('--secure-port' + '=' + String(this.securePort));

        fs.push('--client-ca-file' + '=' + ds + this.clientCAFile);
        fs.push('--tls-cert-file' + '=' + ds + this.tlsCertFile);
        fs.push('--tls-private-key-file' + '=' + ds + this.tlsPrivateKeyFile);

        // fs.push('--kubelet-certificate-authority' + '=' + ds + this.clientCAFile);
        // fs.push('--kubelet-client-certificate' + '=' + ds + this.tlsCertFile);
        // fs.push('--kubelet-client-key' + '=' + ds + this.tlsPrivateKeyFile);
        // fs.push('--kubelet-https' + '=' + 'true');

        if (this.allowPrivileged) {
            fs.push('--allow-privileged' + '=' + 'true');
        } else {
            fs.push('--allow-privileged' + '=' + 'false');
        }

        fs.push('--admission-control' + '=' + this.admissionControl);

        fs.push('--service-cluster-ip-range' + '=' + this.serviceClusterIPRange);


        fs.push('--runtime-config' + '=' + this.runtimeConfig);

        return fs;
    }

    getFlagsTxt(certsDir: string, flag: KubeAPIServerFlag, lineBreak: string) {
        let fs = this.getFlags(certsDir, flag);
        let txt = '';
        for (let _i = 0; _i < fs.length; _i++) {
            txt += fs[_i];
            if (_i + 1 === fs.length) {
                break;
            }
            txt += lineBreak;
        }
        return txt;
    }

    getManifest(certsDir: string, flag: KubeAPIServerFlag) {
        let kubelet = new KubeletConfig(
            false,
            this.getAPIServersTxt(),
            certsDir,
            this.tlsCertFile,
            this.tlsPrivateKeyFile,
            flag.ipAddress,
            this.dnsServiceIP,
        );
        let serviceFileLineBreak = ` \\
    `;
        let kubeletRktOptsTxt = kubelet.getRktOptsTxt(serviceFileLineBreak);
        let kubeletFlagsTxt = kubelet.getFlagsTxt(serviceFileLineBreak);

        let calico = new Calico(this.getEtcdServersTxt(), flag.ipAddress, flag.port);

        let lineBreak = `
    - `;
        return `# /etc/kubernetes/manifests/kube-apiserver.yaml
cat > /tmp/kube-apiserver.yaml <<EOF
apiVersion: v1
kind: Pod

metadata:
  name: kube-apiserver
  namespace: kube-system

spec:
  hostNetwork: true
  containers:
  - name: kube-apiserver
    image: quay.io/coreos/hyperkube:${this.version}
    command:
    - /hyperkube
    - apiserver
    - ${this.getFlagsTxt(certsDir, flag, lineBreak)}
    ports:
    - containerPort: ${this.securePort}
      hostPort: ${this.securePort}
      name: https
    - containerPort: ${flag.port}
      hostPort: ${flag.port}
      name: local
    volumeMounts:
    - mountPath: ${cleanDir(certsDir)}
      name: ssl-certs-kubernetes
      readOnly: true
    - mountPath: /etc/ssl/certs
      name: ssl-certs-host
      readOnly: true
  volumes:
  - hostPath:
      path: ${cleanDir(certsDir)}
    name: ssl-certs-kubernetes
  - hostPath:
      path: /usr/share/ca-certificates
    name: ssl-certs-host
EOF
sudo mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/kube-apiserver.yaml


# /etc/kubernetes/manifests/kube-proxy.yaml
cat > /tmp/kube-proxy.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: kube-proxy
  namespace: kube-system
spec:
  hostNetwork: true
  containers:
  - name: kube-proxy
    image: quay.io/coreos/hyperkube:${this.version}
    command:
    - /hyperkube
    - proxy
    - --master=http://127.0.0.1:${flag.port}
    - --proxy-mode=iptables
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /etc/ssl/certs
      name: ssl-certs-host
      readOnly: true
  volumes:
  - hostPath:
      path: /usr/share/ca-certificates
    name: ssl-certs-host
EOF
sudo mv /tmp/kube-proxy.yaml /etc/kubernetes/manifests/kube-proxy.yaml


# /etc/kubernetes/manifests/kube-controller-manager.yaml
cat > /tmp/kube-controller-manager.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: kube-controller-manager
  namespace: kube-system
spec:
  hostNetwork: true
  containers:
  - name: kube-controller-manager
    image: quay.io/coreos/hyperkube:v1.4.3_coreos.0
    command:
    - /hyperkube
    - controller-manager
    - --master=http://127.0.0.1:${flag.port}
    - --leader-elect=true
    - --root-ca-file=${cleanDir(certsDir) + getDivider(cleanDir(certsDir)) + this.clientCAFile}
    - --service-account-private-key-file=${cleanDir(certsDir) + getDivider(cleanDir(certsDir)) + this.tlsPrivateKeyFile}
    - --cluster-signing-cert-file=${cleanDir(certsDir) + getDivider(cleanDir(certsDir)) + this.tlsCertFile}
    - --cluster-signing-key-file=${cleanDir(certsDir) + getDivider(cleanDir(certsDir)) + this.tlsPrivateKeyFile}
    livenessProbe:
      httpGet:
        host: 127.0.0.1
        path: /healthz
        port: 10252
      initialDelaySeconds: 15
      timeoutSeconds: 1
    volumeMounts:
    - mountPath: ${certsDir}
      name: ssl-certs-kubernetes
      readOnly: true
    - mountPath: /etc/ssl/certs
      name: ssl-certs-host
      readOnly: true
  volumes:
  - hostPath:
      path: ${certsDir}
    name: ssl-certs-kubernetes
  - hostPath:
      path: /usr/share/ca-certificates
    name: ssl-certs-host
EOF
sudo mv /tmp/kube-controller-manager.yaml /etc/kubernetes/manifests/kube-controller-manager.yaml


# /etc/kubernetes/manifests/kube-scheduler.yaml
cat > /tmp/kube-scheduler.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: kube-scheduler
  namespace: kube-system
spec:
  hostNetwork: true
  containers:
  - name: kube-scheduler
    image: quay.io/coreos/hyperkube:${this.version}
    command:
    - /hyperkube
    - scheduler
    - --master=http://127.0.0.1:${flag.port}
    - --leader-elect=true
    livenessProbe:
      httpGet:
        host: 127.0.0.1
        path: /healthz
        port: 10251
      initialDelaySeconds: 15
      timeoutSeconds: 1
EOF
sudo mv /tmp/kube-scheduler.yaml /etc/kubernetes/manifests/kube-scheduler.yaml


# /etc/systemd/system/kubelet.service
cat > /tmp/kubelet.service <<EOF
[Service]
ExecStartPre=/usr/bin/mkdir -p /etc/kubernetes/manifests
ExecStartPre=/usr/bin/mkdir -p /var/log/containers

Environment=KUBELET_VERSION=${this.version}
Environment="RKT_OPTS=${kubeletRktOptsTxt}"

ExecStart=/usr/lib/coreos/kubelet-wrapper${serviceFileLineBreak}${kubeletFlagsTxt}

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/kubelet.service /etc/systemd/system/kubelet.service

${getSystemdCommand('kubelet')}

${calico.get()}
`;
    }
}

