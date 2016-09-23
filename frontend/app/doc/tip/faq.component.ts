import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css']
})
export class faq_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
