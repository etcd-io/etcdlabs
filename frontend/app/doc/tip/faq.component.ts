import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css']
})
export class faq_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
