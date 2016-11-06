import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-maintenance',
    templateUrl: 'maintenance.component.html',
    styleUrls: ['common/common.component.css'],
})
export class MaintenanceTipComponent extends ParentComponent {
    docVersion: string;
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
    }
}
