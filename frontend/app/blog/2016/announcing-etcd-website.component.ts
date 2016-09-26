import { Component } from '@angular/core';
import { BlogComponent } from '../blog.component';

@Component({
    selector: 'announcing-etcd-website',
    templateUrl: 'announcing-etcd-website.component.html',

    // TODO: relative CSS import
    // styleUrls: ['../blog.component.css'],
})
export class AnnouncingEtcdWebsiteComponent extends BlogComponent {
    constructor() {
        super();
    }
}
