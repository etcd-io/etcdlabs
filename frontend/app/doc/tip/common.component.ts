import { Component } from '@angular/core';

export class Version {
    etcdVersion: string;
    etcdVersionURL: string;
    etcdVersionLatestRelease: string;
    etcdFlagPage: string;
}

export class Versioner {
    version: Version = {
        etcdVersion: "tip",
        etcdVersionURL: 'tip',
        etcdVersionLatestRelease: 'v3.1.0',
        etcdFlagPage: 'https://github.com/coreos/etcd/blob/master/etcdmain/help.go',
    };

    getVersion() {
        return this.version;
    }
}

export class sidebarItem {
    title: string;
    description: string;
    url: string;
    htmlClass: string;
    constructor(title: string, description: string, url: string, htmlClass: string) {
        this.title = title;
        this.description = description;
        this.url = url;
        this.htmlClass = htmlClass;
    }
}

export class parentComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();

    getStartedItems: sidebarItem[];
    moreItems: sidebarItem[];

    constructor() {
        this.getStartedItems = [
            new sidebarItem(
                'Why',
                'etcd use cases, when to use',
                `/doc/${this.version.etcdVersionURL}/why`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Install, Deploy',
                'set up etcd cluster in various settings',
                `/doc/${this.version.etcdVersionURL}/install-deploy`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Kubernetes',
                'manage, automate etcd cluster operations using Kubernetes',
                `/doc/${this.version.etcdVersionURL}/kubernetes`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Tutorials',
                'etcdctl, client requests, basic operations',
                `/doc/${this.version.etcdVersionURL}/tutorials`,
                'no-text-decoration'
            ),
        ];

        this.moreItems = [
            new sidebarItem(
                'FAQ',
                'frequently asked questions',
                `/doc/${this.version.etcdVersionURL}/faq`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Performance',
                'benchmark results, performance analysis',
                `/doc/${this.version.etcdVersionURL}/performance`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Reliability',
                `etcd's #1 goal is Reliability, and this is how we ensure that`,
                `/doc/${this.version.etcdVersionURL}/reliability`,
                'no-text-decoration'
            ),
            new sidebarItem(
                'Versions',
                'looking for documentation of other versions?',
                `/doc/${this.version.etcdVersionURL}/versions`,
                'no-text-decoration'
            ),
        ];
    }

    getVersion() {
        return this.version;
    }

    getAllSidebarItems() {
        return this.getStartedItems.concat(this.moreItems);
    }
}
