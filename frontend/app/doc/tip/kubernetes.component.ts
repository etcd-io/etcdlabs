import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { KubernetesInstall } from './common/kubernetes.component';

@Component({
    selector: 'app-kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common/common.component.css'],
})
export class KubernetesTipComponent extends ParentComponent {
    docVersion: string;
    kubeInstall: KubernetesInstall;

    constructor() {
        super();
        this.docVersion = super.getDocVersion();
        this.kubeInstall = new KubernetesInstall('v1.5.0-alpha.2', 'linux', 'amd64', '/');
    }
}
