import { Component } from '@angular/core';
import { Version, parentComponent } from './common.component';

@Component({
    selector: 'install-deploy',
    templateUrl: 'install-deploy.component.html',
    styleUrls: ['common.component.css'],
})
export class install_deploy_tip_Component extends parentComponent {
    inputOrganization: string;
    inputOrganizationUnit: string;
    inputLocationCity: string;
    inputLocationState: string;
    inputLocationCountry: string;

    inputKeyAlgorithm: string;
    inputKeySize: number;
    inputKeyExpirationHour: number;

    inputCommonName: string;

    inputSecure: boolean;
    inputEnableProfile: boolean;
    inputDebug: boolean;

    etcdVersionLatestRelease: string;
    inputVersion: string;

    inputClusterSize: number;

    constructor() {
        super();

        this.inputOrganization = 'etcd';
        this.inputOrganizationUnit = 'etcd, security team';
        this.inputLocationCity = 'San Francisco';
        this.inputLocationState = 'California';
        this.inputLocationCountry = 'USA';

        this.inputKeyAlgorithm = 'rsa';
        this.inputKeySize = 4096;
        this.inputKeyExpirationHour = 87600;

        this.inputCommonName = 'Common Name';

        this.inputSecure = true;
        this.inputEnableProfile = false;
        this.inputDebug = false;

        this.etcdVersionLatestRelease = super.getVersion().etcdVersionLatestRelease;
        this.inputVersion = this.etcdVersionLatestRelease;

        this.inputClusterSize = 3;
    }
}
