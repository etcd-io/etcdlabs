import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { CFSSL } from './common/cfssl.component';
import { Go } from './common/go.component';
import { Etcd, EtcdFlag } from './common/etcd.component';

@Component({
    selector: 'app-install',
    templateUrl: 'install.component.html',
    styleUrls: ['common/common.component.css'],
})
export class InstallComponent extends ParentComponent {
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
    // etcd setting properties
    etcd: Etcd;
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.cfssl = new CFSSL(
            'linux-amd64',
            'R1.2',
            '/opt/bin',
            '/tmp/certs',
            'etcd-root-ca',
            'etcd-gencert.json',
            'etcd',
            'etcd Security',
            'San Francisco',
            'California',
            'USA',
            'rsa',
            2048,
            87600,
            'etcd-root-ca'
        );
        this.inputCFSSLMoreHostsTxt = '';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.go = new Go('1.9');
        this.inputGitUser = 'coreos';
        this.inputGitBranch = 'master';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.etcd = new Etcd(
            this.getLatestReleaseVersion(),
            '/tmp/test-etcd',
            true,
            false,
            false,
            1,
            3,
            [
                new EtcdFlag(
                    's1',
                    '/tmp/etcd/s1',
                    '${HOME}/certs',
                    'localhost',
                    2379,
                    2380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's2',
                    '/tmp/etcd/s2',
                    '${HOME}/certs',
                    'localhost',
                    22379,
                    22380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's3',
                    '/tmp/etcd/s3',
                    '${HOME}/certs',
                    'localhost',
                    32379,
                    32380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's4',
                    '/tmp/etcd/s4',
                    '${HOME}/certs',
                    'localhost',
                    4379,
                    4380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's5',
                    '/tmp/etcd/s5',
                    '${HOME}/certs',
                    'localhost',
                    5379,
                    5380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's6',
                    '/tmp/etcd/s6',
                    '${HOME}/certs',
                    'localhost',
                    6379,
                    6380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    's7',
                    '/tmp/etcd/s7',
                    '${HOME}/certs',
                    'localhost',
                    7379,
                    7380,
                    'tkn',
                    'new',
                    'etcd-root-ca'
                ),
            ]
        );
        ///////////////////////////////////////////////////
    }
}
