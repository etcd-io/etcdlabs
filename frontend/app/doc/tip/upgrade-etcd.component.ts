import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-upgrade-etcd',
    templateUrl: 'upgrade-etcd.component.html',
    styleUrls: ['common.component.css'],
})
export class UpgradeEtcdTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
