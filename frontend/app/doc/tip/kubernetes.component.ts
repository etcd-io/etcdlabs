import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common.component.css'],
})
export class KubernetesTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
