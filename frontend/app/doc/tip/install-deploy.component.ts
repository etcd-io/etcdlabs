import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { CFSSL } from './common/cfssl.component';
import { Go } from './common/go.component';
import { Etcd, EtcdFlag } from './common/etcd.component';
import { Rkt } from './common/rkt.component';

@Component({
    selector: 'app-install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common/common.component.css'],
})
export class InstallDeployTipComponent extends ParentComponent {
    docVersion: string;

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
    customEtcdACI: string;
    ////////////////////////////////////

    constructor() {
        super();
        this.docVersion = super.getDocVersion();

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
            'v3.1.0-rc.0',
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
                    'TEST_IP_1',
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
                    'TEST_IP_2',
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
                    'TEST_IP_3',
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
                    'TEST_IP_4',
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
                    'TEST_IP_5',
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
                    'TEST_IP_6',
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
                    'TEST_IP_7',
                    2379,
                    2380,
                    'my-etcd-token',
                    'new',
                    'etcd-root-ca'
                ),
            ]
        );
        ///////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        this.rkt = new Rkt('v1.18.0', '/');
        this.customEtcdACI = '';
        ///////////////////////////////////////////////////
    }
}
