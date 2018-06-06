export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.7';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
