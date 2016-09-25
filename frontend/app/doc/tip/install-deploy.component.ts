import { Component } from '@angular/core';
import { Version, parentComponent } from './common.component';

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class install_deploy_tip_Component extends parentComponent {
    version: Version;
    constructor() {
        super();
        this.version = super.getVersion();
    }
}
