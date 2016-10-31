import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-maintenance',
    templateUrl: 'maintenance.component.html',
    styleUrls: ['common.component.css'],
})
export class MaintenanceTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
