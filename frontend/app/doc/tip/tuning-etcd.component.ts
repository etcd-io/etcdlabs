import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-tuning-etcd',
    templateUrl: 'tuning-etcd.component.html',
    styleUrls: ['common.component.css'],
})
export class TuningEtcdTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
