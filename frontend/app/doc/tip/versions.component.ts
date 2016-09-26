import { Component } from '@angular/core';
import { parentComponent } from './common.component';

export class versionItem {
    version: string;
    versionHTMLClassLinkRelease: string;
    releaseLink: string;
    docLink: string;
    versionHTMLClassLinkDoc: string;
    constructor(version: string, releaseLink: string, versionHTMLClassLinkRelease: string, docLink: string, versionHTMLClassLinkDoc: string) {
        this.version = version;
        this.releaseLink = releaseLink;
        this.versionHTMLClassLinkRelease = versionHTMLClassLinkRelease;

        this.docLink = docLink;
        this.versionHTMLClassLinkDoc = versionHTMLClassLinkDoc;
    }
}

export class majorVersionItem {
    version: string;
    versionItems: versionItem[];
    constructor(version: string, versionItems: versionItem[]) {
        this.version = version;
        this.versionItems = versionItems;
    }
}

@Component({
    selector: 'versions',
    templateUrl: 'versions.component.html',
    styleUrls: ['common.component.css'],
})
export class versions_tip_Component extends parentComponent {
    majorVersionItems: majorVersionItem[];
    constructor() {
        super();
        this.majorVersionItems = [
            new majorVersionItem('v3', [
                new versionItem(
                    'tip (master branch)',
                    'https://github.com/coreos/etcd',
                    'versions-link-main',
                    '/doc/tip',
                    'versions-link-other'
                ),
                new versionItem(
                    'v3.1.0',
                    'https://github.com/coreos/etcd/releases/tag/v3.1.0',
                    'versions-link-main-emphasize',
                    '/doc/v31',
                    'versions-link-other'
                ),
                new versionItem(
                    'v3.0.10',
                    'https://github.com/coreos/etcd/releases/tag/v3.0.10',
                    'versions-link-main',
                    'https://github.com/coreos/etcd/tree/release-3.0/Documentation',
                    'versions-link-other'
                ),
                new versionItem(
                    'v3.0.0',
                    'https://github.com/coreos/etcd/releases/tag/v3.0.0',
                    'versions-link-main',
                    'https://github.com/coreos/etcd/tree/release-3.0/Documentation',
                    'versions-link-other'
                ),
            ]),
            new majorVersionItem('v2', [
                new versionItem(
                    'v2.3.7',
                    'https://github.com/coreos/etcd/releases/tag/v2.3.7',
                    'versions-link-main',
                    'https://github.com/coreos/etcd/tree/release-2.3/Documentation',
                    'versions-link-other'
                ),
            ]),
        ]
    }
}
