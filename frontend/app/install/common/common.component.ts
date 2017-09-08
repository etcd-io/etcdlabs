export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.8';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
