import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'reliability',
    templateUrl: 'reliability.component.html',
    styleUrls: ['common.component.css']
})
export class reliability_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
