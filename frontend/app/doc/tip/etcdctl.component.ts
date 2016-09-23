import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'etcdctl',
    templateUrl: 'etcdctl.component.html',
    styleUrls: ['common.component.css']
})
export class etcdctl_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
