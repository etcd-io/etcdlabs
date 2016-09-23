import { Component } from '@angular/core';

export class Version {
    etcdVersion: string;
    etcdVersionURL: string;
    etcdVersionLatestRelease: string;
}

export class Versioner {
    version: Version = {
        etcdVersion: "tip",
        etcdVersionURL: 'tip',
        etcdVersionLatestRelease: "v3.1.0-alpha.1"
    };

    getVersion() {
        return this.version;
    }
}


export class sidebarItem {
    title: string;
    url: string;
    constructor(title: string, url: string) {
        this.title = title;
        this.url = url;
    }
}

export class parentComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();

    getStartedItems;
    tutorialItems;
    moreItems;
    otherVersions;

    constructor() {
        this.getStartedItems = [
            new sidebarItem('Install, Deploy', `/doc/${this.version.etcdVersionURL}/install-deploy`),
            new sidebarItem('Kubernetes', `/doc/${this.version.etcdVersionURL}/kubernetes`)
        ];

        this.tutorialItems = [
            new sidebarItem('etcdctl', `/doc/${this.version.etcdVersionURL}/etcdctl`)
        ];

        this.moreItems = [
            new sidebarItem('FAQ', `/doc/${this.version.etcdVersionURL}/faq`),
            new sidebarItem('Performance', `/doc/${this.version.etcdVersionURL}/performance`),
            new sidebarItem('Reliability', `/doc/${this.version.etcdVersionURL}/reliability`)
        ];

        this.otherVersions = [
            new sidebarItem('v3.1 (Planned)', '/doc/v31'),
            new sidebarItem('v3.2 (Planned)', '/doc/v32')
        ];
    }
}
