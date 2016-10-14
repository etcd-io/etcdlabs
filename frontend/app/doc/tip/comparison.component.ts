import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-comparison',
    templateUrl: 'comparison.component.html',
    styleUrls: ['common.component.css'],
})
export class ComparisonTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
