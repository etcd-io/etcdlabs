import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common.component.css']
})
export class kubernetes_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
