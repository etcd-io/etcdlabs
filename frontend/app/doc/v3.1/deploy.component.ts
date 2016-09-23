import { Component } from '@angular/core';
import { EtcdVersion } from './etcd-version';

@Component({
    selector: 'deploy',
    templateUrl: 'deploy.component.html',
    styleUrls: ['common.component.css']
})

export class DeployV31Component {
    etcdVersion: EtcdVersion = {
        version: "v3.1",
        docPath: '/doc/v31'
    };
}
