export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.1.1';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
