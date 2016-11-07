import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { KubernetesInstall } from './common/kubernetes.component';
import { CFSSL } from './common/cfssl.component';

@Component({
    selector: 'app-kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common/common.component.css'],
})
export class KubernetesTipComponent extends ParentComponent {
    docVersion: string;
    kubeInstall: KubernetesInstall;

    cfssl: CFSSL;

    certsDir: string;

    inputEtcdEndpointsTxt: string;

    inputEtcdRootCAFile: string;
    inputEtcdCertFile: string;
    inputEtcdKeyFile: string;

    inputMoreMasterNodeIPsTxt: string;

    constructor() {
        super();
        this.docVersion = super.getDocVersion();
        this.kubeInstall = new KubernetesInstall('v1.5.0-alpha.2', 'linux', 'amd64', '/');

        this.cfssl = new CFSSL(
            'R1.2',
            '/usr/local/bin',
            '$HOME/certs',
            'kube-root-ca',
            'kube-gencert.json',
            'Kubernetes',
            'Kubernetes security',
            'San Francisco',
            'California',
            'USA',
            'rsa',
            4096,
            87600,
            'kube-root-ca'
        );

        this.certsDir = '/etc/kubernetes/ssl';

        this.inputEtcdEndpointsTxt = `https://10.240.0.35:2379
https://10.240.0.36:2379
https://10.240.0.37:2379
`;

        this.inputEtcdRootCAFile = 'etcd-root-ca.pem';
        this.inputEtcdCertFile = 'my-etcd-1.pem';
        this.inputEtcdKeyFile = 'my-etcd-1-key.pem';

        this.inputMoreMasterNodeIPsTxt = `10.240.0.39
10.240.0.40
10.240.0.41
`;
    }
}
