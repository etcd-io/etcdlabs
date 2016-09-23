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