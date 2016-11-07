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
    docVersion: string;

    getStartedItems: SidebarItem[];
    operationItems: SidebarItem[];

    constructor() {
        this.docVersion = 'tip';

        this.getStartedItems = [
            new SidebarItem(
                'Install and Deploy',
                'set up etcd cluster: bare metal, virtual machine, systemd, rkt',
                `/doc/${this.docVersion}/install-deploy`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Quick Tutorials',
                'write, read, watch, lock, election, membership, maintenance',
                `/doc/${this.docVersion}/quick-tutorials`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'FAQ',
                'frequently asked questions',
                `/doc/${this.docVersion}/faq`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'etcd in Comparison',
                `etcd in comparison with other databases`,
                `/doc/${this.docVersion}/comparison`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'etcd STM',
                `etcd Software Transactional Memory`,
                `/doc/${this.docVersion}/stm`,
                'no-text-decoration'
            ),
        ];

        this.operationItems = [
            new SidebarItem(
                'Tuning etcd',
                'things to consider when configuring etcd',
                `/doc/${this.docVersion}/tuning-etcd`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Mirror Maker',
                'mirroring etcd cluster',
                `/doc/${this.docVersion}/mirror-maker`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'gRPC Proxy',
                'stateless etcd reverse proxy at gRPC layer (L7)',
                `/doc/${this.docVersion}/grpc-proxy`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Maintenance',
                'compaction, backup, defragmentation, space quota',
                `/doc/${this.docVersion}/maintenance`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Upgrade etcd',
                'upgrade, migrate etcd to latest versions',
                `/doc/${this.docVersion}/upgrade-etcd`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Runtime Reconfiguration',
                'dynamic reconfiguration of etcd cluster membership',
                `/doc/${this.docVersion}/runtime-reconfiguration`,
                'no-text-decoration'
            ),
            new SidebarItem(
                'Disaster Recovery',
                'handle outages on etcd',
                `/doc/${this.docVersion}/disaster-recovery`,
                'no-text-decoration'
            ),
        ];
    }

    getDocVersion() {
        return this.docVersion;
    }

    getAllSidebarItems() {
        return this.getStartedItems.concat(this.operationItems);
    }
}
