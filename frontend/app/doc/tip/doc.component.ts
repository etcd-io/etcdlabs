import { Component } from '@angular/core';
import { ParentComponent, SidebarItem } from './common/common.component';

export class VersionItem {
    isRoutable: boolean;
    version: string;
    versionHTMLClassLinkRelease: string;
    releaseLink: string;
    docLink: string;
    versionHTMLClassLinkDoc: string;
    constructor(
        isRoutable: boolean,
        version: string,
        releaseLink: string,
        versionHTMLClassLinkRelease: string,
        docLink: string,
        versionHTMLClassLinkDoc: string,
    ) {
        this.isRoutable = isRoutable;
        this.version = version;
        this.releaseLink = releaseLink;
        this.versionHTMLClassLinkRelease = versionHTMLClassLinkRelease;

        this.docLink = docLink;
        this.versionHTMLClassLinkDoc = versionHTMLClassLinkDoc;
    }
}

export class MajorVersionItem {
    version: string;
    versionItems: VersionItem[];
    constructor(version: string, versionItems: VersionItem[]) {
        this.version = version;
        this.versionItems = versionItems;
    }
}

@Component({
    selector: 'app-doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common/common.component.css'],
})
export class DocTipComponent extends ParentComponent {
    docVersion: string;
    docItems: SidebarItem[];
    majorVersionItems: MajorVersionItem[];
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
        this.docItems = super.getAllSidebarItems();
        this.majorVersionItems = [
            new MajorVersionItem('v3', [
                new VersionItem(
                    true,
                    'tip',
                    'https://github.com/coreos/etcd',
                    'versions-link-main',
                    '/doc/tip',
                    'versions-link-other'
                ),
                new VersionItem(
                    false,
                    'v3.1.0',
                    'https://github.com/coreos/etcd/releases/tag/v3.1.0-rc.0',
                    'versions-link-main-emphasize',
                    '/doc/v3.1',
                    'versions-link-other'
                ),
                new VersionItem(
                    false,
                    'v3.0.14',
                    'https://github.com/coreos/etcd/releases/tag/v3.0.14',
                    'versions-link-main',
                    'https://coreos.com/etcd/docs/latest',
                    'versions-link-other'
                ),
                new VersionItem(
                    false,
                    'v3.0.0',
                    'https://github.com/coreos/etcd/releases/tag/v3.0.0',
                    'versions-link-main',
                    'https://github.com/coreos/etcd/tree/release-3.0/Documentation',
                    'versions-link-other'
                ),
            ]),
            new MajorVersionItem('v2', [
                new VersionItem(
                    false,
                    'v2.3.7',
                    'https://github.com/coreos/etcd/releases/tag/v2.3.7',
                    'versions-link-main',
                    'https://github.com/coreos/etcd/tree/release-2.3/Documentation',
                    'versions-link-other'
                ),
            ]),
        ];
    }
}
