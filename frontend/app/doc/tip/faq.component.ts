import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css']
})

export class FAQTipComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
