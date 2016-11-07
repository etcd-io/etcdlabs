import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { KubernetesInstall, KubeAPIServer, KubeAPIServerFlag } from './common/kubernetes.component';
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

    kubeAPIServer: KubeAPIServer;

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

        this.kubeAPIServer = new KubeAPIServer(
            'v1.4.5_coreos.0',
            1,
            '10.240.0.0/24',
            '10.240.0.0/24',
            [
                new KubeAPIServerFlag('10.240.0.39', 8080),
                new KubeAPIServerFlag('10.240.0.40', 8080),
                new KubeAPIServerFlag('10.240.0.41', 8080),
            ],
        );
    }
}
