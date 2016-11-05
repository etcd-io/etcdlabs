import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-disaster-recovery',
    templateUrl: 'disaster-recovery.component.html',
    styleUrls: ['common/common.component.css'],
})
export class DisasterRecoveryTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
