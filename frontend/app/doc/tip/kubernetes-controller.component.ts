import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'kubernetes-controller',
    templateUrl: 'kubernetes-controller.component.html',
    styleUrls: ['common.component.css'],
})
export class kubernetes_controller_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
