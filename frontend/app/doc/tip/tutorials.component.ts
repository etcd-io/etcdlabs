import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'tutorials',
    templateUrl: 'tutorials.component.html',
    styleUrls: ['common.component.css']
})
export class tutorials_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
