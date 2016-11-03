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
    operationItems: SidebarItem[];

    constructor() {
        this.getStartedItems = [
            new SidebarItem(
                'Install and Deploy',
                'set up etcd cluster: bare metal, virtual machine, systemd, rkt',
                `/doc/${this.version.etcdVersionURL}/install-deploy`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Kubernetes etcd-operator',
                'fully managed etcd with Kubernetes',
                `/doc/${this.version.etcdVersionURL}/kubernetes-etcd-operator`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Kubernetes',
                'how to run etcd with Kubernetes',
                `/doc/${this.version.etcdVersionURL}/kubernetes`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Quick Tutorials',
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
                'etcd in Comparison',
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
        ];

        // TODO
        this.operationItems = [
            new SidebarItem(
                'Tuning etcd',
                'things to consider when configuring etcd',
                `/doc/${this.version.etcdVersionURL}/tuning-etcd`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Mirror Maker',
                'mirroring etcd cluster',
                `/doc/${this.version.etcdVersionURL}/mirror-maker`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'gRPC Proxy',
                'stateless etcd reverse proxy at gRPC layer (L7)',
                `/doc/${this.version.etcdVersionURL}/grpc-proxy`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Maintenance',
                'compaction, backup, defragmentation, space quota',
                `/doc/${this.version.etcdVersionURL}/maintenance`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Upgrade etcd',
                'upgrade, migrate etcd to latest versions',
                `/doc/${this.version.etcdVersionURL}/upgrade-etcd`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Runtime Reconfiguration',
                'dynamic reconfiguration of etcd cluster membership',
                `/doc/${this.version.etcdVersionURL}/runtime-reconfiguration`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Disaster Recovery',
                'handle outages on etcd',
                `/doc/${this.version.etcdVersionURL}/disaster-recovery`,
                'no-text-decoration'
            ),
        ];
    }

    getVersion() {
        return this.version;
    }

    getAllSidebarItems() {
        return this.getStartedItems.concat(this.operationItems);
    }
}
