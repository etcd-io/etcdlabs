import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css'],
})
export class FAQTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
