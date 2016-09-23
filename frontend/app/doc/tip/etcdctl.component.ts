import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'etcdctl',
    templateUrl: 'etcdctl.component.html',
    styleUrls: ['common.component.css']
})
export class etcdctl_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
