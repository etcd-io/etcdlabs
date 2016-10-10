import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css'],
})
export class FAQTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
