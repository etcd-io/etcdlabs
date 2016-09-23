import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css']
})

export class InstallDeployTipComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
