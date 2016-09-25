import { Component } from '@angular/core';
import { Version, parentComponent } from './common.component';

export class etcdFlag {
    name: string;
    dataDir: string;

    protocol: string;
    ipAddress: string;
    clientPort: number;
    peerPort: number;

    clusterToken: string;
    clusterState: string;

    initialCluster: string;

    clientCertFile: string;
    clientKeyFile: string;
    clientTrustedCAFile: string;

    peerCertFile: string;
    peerKeyFile: string;
    peerTrustedCAFile: string;

    // TODO: clean this up
    constructor(
        name: string,
        dataDir: string,

        inputSecure: boolean,
        ipAddress: string,
        clientPort: number,
        peerPort: number,

        clusterToken: string,
        clusterState: string,

        initialCluster: string,

        clientCertFile: string,
        clientKeyFile: string,
        clientTrustedCAFile: string,

        peerCertFile: string,
        peerKeyFile: string,
        peerTrustedCAFile: string,
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

        this.clusterToken = clusterToken;
        this.clusterState = clusterState;

        this.initialCluster = initialCluster;

        this.clientCertFile = clientCertFile;
        this.clientKeyFile = clientKeyFile;
        this.clientTrustedCAFile = clientTrustedCAFile;

        this.peerCertFile = peerCertFile;
        this.peerKeyFile = peerKeyFile;
        this.peerTrustedCAFile = peerTrustedCAFile;
    }
}

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class install_deploy_tip_Component extends parentComponent {
    inputOrganization: string;
    inputOrganizationUnit: string;
    inputLocationCity: string;
    inputLocationState: string;
    inputLocationCountry: string;

    inputKeyAlgorithm: string;
    inputKeySize: number;
    inputKeyExpirationHour: number;

    inputCommonName: string;

    inputSecure: boolean;
    inputEnableProfile: boolean;
    inputDebug: boolean;

    etcdVersionLatestRelease: string;
    inputVersion: string;

    inputClusterSize: number;

    flags: etcdFlag[];

    constructor() {
        super();

        this.inputOrganization = 'etcd';
        this.inputOrganizationUnit = 'etcd, security team';
        this.inputLocationCity = 'San Francisco';
        this.inputLocationState = 'California';
        this.inputLocationCountry = 'USA';

        this.inputKeyAlgorithm = 'rsa';
        this.inputKeySize = 4096;
        this.inputKeyExpirationHour = 87600;

        this.inputCommonName = 'etcd';

        this.inputSecure = true;
        this.inputEnableProfile = false;
        this.inputDebug = false;

        this.etcdVersionLatestRelease = super.getVersion().etcdVersionLatestRelease;
        this.inputVersion = this.etcdVersionLatestRelease;

        this.inputClusterSize = 3;

        this.flags = [
            new etcdFlag(
                'test-name-1',
                '/tmp/test-name-1.data',
                this.inputSecure,
                'localhost',
                12379,
                12380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-1.pem',
                '/tmp/tests/cert-1-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-1.pem',
                '/tmp/tests/cert-1-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-2',
                '/tmp/test-name-2.data',
                this.inputSecure,
                'localhost',
                22379,
                22380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-2.pem',
                '/tmp/tests/cert-2-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-2.pem',
                '/tmp/tests/cert-2-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-3',
                '/tmp/test-name-3.data',
                this.inputSecure,
                'localhost',
                32379,
                32380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-3.pem',
                '/tmp/tests/cert-3-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-3.pem',
                '/tmp/tests/cert-3-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-4',
                '/tmp/test-name-4.data',
                this.inputSecure,
                'localhost',
                4379,
                4380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-4.pem',
                '/tmp/tests/cert-4-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-4.pem',
                '/tmp/tests/cert-4-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-5',
                '/tmp/test-name-5.data',
                this.inputSecure,
                'localhost',
                5379,
                5380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-5.pem',
                '/tmp/tests/cert-5-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-5.pem',
                '/tmp/tests/cert-5-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-6',
                '/tmp/test-name-6.data',
                this.inputSecure,
                'localhost',
                6379,
                6380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-6.pem',
                '/tmp/tests/cert-6-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-6.pem',
                '/tmp/tests/cert-6-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
            new etcdFlag(
                'test-name-7',
                '/tmp/test-name-7.data',
                this.inputSecure,
                'localhost',
                7379,
                7380,
                'test-token',
                'new',
                '',
                '/tmp/tests/cert-7.pem',
                '/tmp/tests/cert-7-key.pem',
                '/tmp/tests/trusted-ca.pem',
                '/tmp/tests/cert-7.pem',
                '/tmp/tests/cert-7-key.pem',
                '/tmp/tests/trusted-ca.pem'
            ),
        ];
    }

    getInitialCluster() {
        if (this.inputClusterSize > 7) {
            this.inputClusterSize = 7;
        }

        let txt = '';
        for (let _i = 0; _i < this.flags.length; _i++) {
            if (_i > 0) {
                txt += ',';
            }

            if (this.inputSecure) {
                this.flags[_i].protocol = 'https';
            } else {
                this.flags[_i].protocol = 'http';
            }

            txt += this.flags[_i].name + '=' +
                this.flags[_i].protocol + '://' +
                this.flags[_i].ipAddress + ':' + String(this.flags[_i].clientPort);

            if (_i + 1 === this.inputClusterSize) {
                break;
            }
        }
        for (let _i = 0; _i < this.flags.length; _i++) {
            this.flags[_i].initialCluster = txt;
        }
        return txt;
    }
}
