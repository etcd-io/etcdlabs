import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'tutorials-advanced',
    templateUrl: 'tutorials-advanced.component.html',
    styleUrls: ['common.component.css'],
})
export class tutorials_advanced_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
