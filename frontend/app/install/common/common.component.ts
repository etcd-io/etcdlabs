export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.1.3';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
