export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.1';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
