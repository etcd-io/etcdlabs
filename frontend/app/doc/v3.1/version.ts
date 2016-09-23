export class Version {
    etcdVersion: string;
    etcdVersionURL: string;
    etcdVersionLatestRelease: string;
}

export class Versioner {
    version: Version = {
        etcdVersion: "v3.1",
        etcdVersionURL: 'v3.1',
        etcdVersionLatestRelease: "v3.1.0"
    };

    getVersion() {
        return this.version;
    }
}
