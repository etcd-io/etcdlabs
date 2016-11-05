import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-quick-tutorials',
    templateUrl: 'quick-tutorials.component.html',
    styleUrls: ['common/common.component.css'],
})
export class QuickTutorialsTipComponent extends ParentComponent {
    constructor() {
        super();
    }

    getEtcdctlSetup() {
        return `export ETCDCTL_API=3
` + 'ENDPOINTS=localhost:12379,localhost:22379,localhost:32379' + `

` + 'etcdctl --endpoints=${ENDPOINTS} endpoint health';
    }

    getEtcdctlWrite() {
        return 'etcdctl --endpoints=${ENDPOINTS} put foo "Hello World!"' + `
` + 'etcdctl --endpoints=${ENDPOINTS} put foo1 bar1' + `
` + 'etcdctl --endpoints=${ENDPOINTS} put foo2 bar2' + `

` + 'etcdctl --endpoints=${ENDPOINTS} get foo' + `
` + 'etcdctl --endpoints=${ENDPOINTS} get foo --write-out=json' + `
` + 'etcdctl --endpoints=${ENDPOINTS} get foo --prefix';
    }

    getEtcdctlRead() {
        return 'etcdctl --endpoints=${ENDPOINTS} get foo' + `
` + 'etcdctl --endpoints=${ENDPOINTS} get foo --prefix' + `

` + 'etcdctl --endpoints=${ENDPOINTS} get foo --write-out=json' + `
` + 'etcdctl --endpoints=${ENDPOINTS} get foo --rev=33' + `

# get all keys
` + 'etcdctl --endpoints=${ENDPOINTS} get "" --from-key' + `
` + 'etcdctl --endpoints=${ENDPOINTS} get "" --prefix';
    }

    getEtcdctlDelete() {
        return 'etcdctl --endpoints=${ENDPOINTS} get foo' + `
` + 'etcdctl --endpoints=${ENDPOINTS} del foo' + `

` + 'etcdctl --endpoints=${ENDPOINTS} get foo --prefix' + `
` + 'etcdctl --endpoints=${ENDPOINTS} del foo --prefix' + `

` + '# delete all keys' + `
` + 'etcdctl --endpoints=${ENDPOINTS} del "" --from-key' + `
` + 'etcdctl --endpoints=${ENDPOINTS} del "" --prefix';
    }

    getEtcdctlTxn() {
        return 'etcdctl --endpoints=${ENDPOINTS} put mykey BAD' + `
` + 'etcdctl --endpoints=${ENDPOINTS} txn --interactive' + `

compares:
value("mykey") = "BAD"      

success requests (get, put, delete):
put mykey GOOD

failure requests (get, put, delete):
del mykey
`;
    }

    getEtcdctlLease() {
        return 'etcdctl --endpoints=${ENDPOINTS} lease grant 300' + `
` + 'etcdctl --endpoints=${ENDPOINTS} put hello value --lease=ID' + `

` + 'etcdctl --endpoints=${ENDPOINTS} lease timetolive ID' + `
` + 'etcdctl --endpoints=${ENDPOINTS} lease keep-alive ID' + `
` + 'etcdctl --endpoints=${ENDPOINTS} lease revoke ID';
    }

    getEtcdctlWatch() {
        return 'etcdctl --endpoints=${ENDPOINTS} watch stock1' + `
` + 'etcdctl --endpoints=${ENDPOINTS} watch stock --prefix';
    }

    getEtcdctlLock() {
        return 'etcdctl --endpoints=${ENDPOINTS} lock samelock' + `
` + 'etcdctl --endpoints=${ENDPOINTS} lock samelock';
    }

    getEtcdctlElect() {
        return 'etcdctl --endpoints=${ENDPOINTS} elect candidate p1' + `
` + 'etcdctl --endpoints=${ENDPOINTS} elect candidate p2';
    }

    getEtcdctlMember() {
        return 'etcdctl --endpoints=${ENDPOINTS} member list' + `

` + 'etcdctl --endpoints=${ENDPOINTS} member remove ${MEMBER_ID}' + `

` + 'etcdctl --endpoints=${ENDPOINTS} member add my-etcd-4' + ' \\' + `
    --peer-urls=http://localhost:42380`;
    }

    getEtcdctlCompact() {
        return 'etcdctl --endpoints=${ENDPOINTS} compact 10' + `
` + 'etcdctl --endpoints=${ENDPOINTS} elect candidate p2';
    }
}
