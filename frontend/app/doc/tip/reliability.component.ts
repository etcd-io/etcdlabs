import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'reliability',
    templateUrl: 'reliability.component.html',
    styleUrls: ['common.component.css']
})

export class ReliabilityTipComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
