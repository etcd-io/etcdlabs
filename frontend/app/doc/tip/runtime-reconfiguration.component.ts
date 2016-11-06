import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-runtime-reconfiguration',
    templateUrl: 'runtime-reconfiguration.component.html',
    styleUrls: ['common/common.component.css'],
})
export class RuntimeReconfigurationTipComponent extends ParentComponent {
    docVersion: string;
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
    }
}
