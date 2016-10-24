import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common.component.css'],
})
export class KubernetesTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
