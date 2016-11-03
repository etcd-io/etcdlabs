import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-kubernetes-etcd-operator',
    templateUrl: 'kubernetes-etcd-operator.component.html',
    styleUrls: ['common.component.css'],
})
export class KubernetesEtcdOperatorTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
