export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.0-rc.0';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
