export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.1';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
