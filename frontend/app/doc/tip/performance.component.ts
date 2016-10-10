import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-performance',
    templateUrl: 'performance.component.html',
    styleUrls: ['common.component.css'],
})
export class PerformanceTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
