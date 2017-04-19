export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.1.6';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
