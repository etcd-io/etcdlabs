import { Component } from '@angular/core';
import { EtcdVersion } from './etcd-version';

@Component({
    selector: 'doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css']
})

export class DocV31Component {
    etcdVersion: EtcdVersion = {
        version: "v3.1",
        docPath: '/doc/v31'
    };
}
