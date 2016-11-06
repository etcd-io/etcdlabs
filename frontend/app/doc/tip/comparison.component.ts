import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-comparison',
    templateUrl: 'comparison.component.html',
    styleUrls: ['common/common.component.css'],
})
export class ComparisonTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
