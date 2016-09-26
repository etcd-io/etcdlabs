import { Component } from '@angular/core';
import { BlogComponent } from '../blog.component';

@Component({
    selector: 'announcing-etcd-v3.1',
    templateUrl: 'announcing-etcd-v3.1.component.html',

    // TODO: relative CSS import
    // styleUrls: ['../blog.component.css'],
})
export class AnnouncingEtcdV31Component extends BlogComponent {
    constructor() {
        super();
    }
}
