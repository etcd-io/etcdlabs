import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'performance',
    templateUrl: 'performance.component.html',
    styleUrls: ['common.component.css'],
})
export class performance_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
