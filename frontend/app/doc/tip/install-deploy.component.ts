import { Component } from '@angular/core';
import { Versioner } from './version';

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css']
})
export class install_deploy_tip_Component {
    versioner = new Versioner();
    version = this.versioner.getVersion();
}
