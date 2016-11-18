import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { CFSSL } from './common/cfssl.component';
import { Go } from './common/go.component';
import { Etcd, EtcdFlag } from './common/etcd.component';
import { Rkt } from './common/rkt.component';

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

    ////////////////////////////////////
    // rkt setting properties
    rkt: Rkt;
    ////////////////////////////////////

    constructor() {
        super();

        ///////////////////////////////////////////////////
        this.cfssl = new CFSSL(
            'R1.2',
            '/usr/local/bin',
            '$HOME/certs',
            'etcd-root-ca',
            'etcd-gencert.json',
            'etcd',
            'etcd security',
            'San Francisco',
            'California',
            'USA',
            'rsa',
            4096,
            87600,
            'etcd-root-ca'
        );
        this.inputCFSSLMoreHostsTxt = '';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.go = new Go('1.7.3');
        this.inputGitUser = 'coreos';
        this.inputGitBranch = 'master';
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.etcd = new Etcd(
            this.getLatestReleaseVersion(),
            '/',
            true,
            false,
            false,
            1,
            3,
            [
                new EtcdFlag(
                    'my-etcd-1',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.35',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-2',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.36',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-3',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.37',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-4',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.38',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-5',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.39',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-6',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.40',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
                new EtcdFlag(
                    'my-etcd-7',
                    '/var/lib/etcd',
                    '/etc/ssl/certs',
                    '10.240.0.41',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
            ],
            new Rkt('v1.19.0', '/', '', '', '')
        );
        ///////////////////////////////////////////////////
    }
}
