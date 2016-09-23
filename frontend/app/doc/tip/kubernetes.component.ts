import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'kubernetes',
    templateUrl: 'kubernetes.component.html',
    styleUrls: ['common.component.css']
})

export class KubernetesTipComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
