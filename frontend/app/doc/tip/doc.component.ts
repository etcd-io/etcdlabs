import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css']
})

export class DocTipComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
