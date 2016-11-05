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


export class Etcd {

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
