import { Component } from '@angular/core';
import { EtcdVersion } from './etcd-version';

@Component({
    selector: 'faq',
    templateUrl: 'faq.component.html',
    styleUrls: ['common.component.css']
})

export class FAQV31Component {
    etcdVersion: EtcdVersion = {
        version: "v3.1",
        docPath: '/doc/v31'
    };
}
