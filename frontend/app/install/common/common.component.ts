export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.8';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
