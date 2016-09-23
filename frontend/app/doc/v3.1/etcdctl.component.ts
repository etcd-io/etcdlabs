import { Component } from '@angular/core';
import { EtcdVersion } from './etcd-version';

@Component({
    selector: 'etcdctl',
    templateUrl: 'etcdctl.component.html',
    styleUrls: ['common.component.css']
})

export class EtcdctlV31Component {
    etcdVersion: EtcdVersion = {
        version: "v3.1",
        docPath: '/doc/v31'
    };
}
