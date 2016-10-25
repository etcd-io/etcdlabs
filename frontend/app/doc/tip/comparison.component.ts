import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-comparison',
    templateUrl: 'comparison.component.html',
    styleUrls: ['common.component.css'],
})
export class ComparisonTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
