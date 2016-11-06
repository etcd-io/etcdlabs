import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-tuning-etcd',
    templateUrl: 'tuning-etcd.component.html',
    styleUrls: ['common/common.component.css'],
})
export class TuningEtcdTipComponent extends ParentComponent {
    docVersion: string;
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
    }
}
