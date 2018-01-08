export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.0-rc.1';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
