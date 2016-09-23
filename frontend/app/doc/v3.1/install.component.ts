import { Component } from '@angular/core';
import { EtcdVersion } from './etcd-version';

@Component({
    selector: 'install',
    templateUrl: 'install.component.html',
    styleUrls: ['common.component.css']
})

export class InstallV31Component {
    etcdVersion: EtcdVersion = {
        version: "v3.1",
        docPath: '/doc/v31'
    };
}
