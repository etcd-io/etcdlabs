import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'performance',
    templateUrl: 'performance.component.html',
    styleUrls: ['common.component.css']
})
export class performance_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
