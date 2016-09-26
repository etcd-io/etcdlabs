import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'why',
    templateUrl: 'why.component.html',
    styleUrls: ['common.component.css', 'why.component.css'],
})
export class why_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
