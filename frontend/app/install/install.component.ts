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
        this.go = new Go('1.8');
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
                    '10.240.0.1',
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
                    '10.240.0.2',
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
                    '10.240.0.3',
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
                    '10.240.0.4',
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
                    '10.240.0.5',
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
                    '10.240.0.6',
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
                    '10.240.0.7',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
            ]
        );
        ///////////////////////////////////////////////////
    }
}
