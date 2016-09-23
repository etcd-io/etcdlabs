import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css']
})
export class doc_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
