import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common/common.component.css'],
})
export class FAQTipComponent extends ParentComponent {
    docVersion: string;
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
    }
}
