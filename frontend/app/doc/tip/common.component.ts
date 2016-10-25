export class Version {
    goVersion: string;
    etcdVersion: string;
    etcdVersionURL: string;
    etcdVersionLatestRelease: string;
    etcdFlagPage: string;
}

export class Versioner {
    version: Version = {
        goVersion: '1.7.3',
        etcdVersion: 'tip',
        etcdVersionURL: 'tip',
        etcdVersionLatestRelease: 'v3.1.0-rc.0',
        etcdFlagPage: 'https://github.com/coreos/etcd/blob/master/etcdmain/help.go',
    };

    getVersion() {
        return this.version;
    }
}

export class SidebarItem {
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

export class ParentComponent {
    versioner = new Versioner();
    version = this.versioner.getVersion();

    getStartedItems: SidebarItem[];

    constructor() {
        this.getStartedItems = [
            new SidebarItem(
                'Install and deploy',
                'set up etcd cluster: bare metal, virtual machine, systemd, rkt',
                `/doc/${this.version.etcdVersionURL}/install-deploy`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Kubernetes',
                'manage etcd with Kubernetes',
                `/doc/${this.version.etcdVersionURL}/kubernetes`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Quick tutorials',
                'write, read, watch, lock, election, membership, maintenance',
                `/doc/${this.version.etcdVersionURL}/quick-tutorials`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'FAQ',
                'frequently asked questions',
                `/doc/${this.version.etcdVersionURL}/faq`,
                'no-text-decoration'
            ),

            new SidebarItem(
                'etcd in comparison',
                `etcd in comparison with other databases`,
                `/doc/${this.version.etcdVersionURL}/comparison`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'etcd STM',
                `etcd Software Transactional Memory`,
                `/doc/${this.version.etcdVersionURL}/stm`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Other versions',
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
        // return this.getStartedItems.concat(this.moreItems);
        return this.getStartedItems;
    }
}
