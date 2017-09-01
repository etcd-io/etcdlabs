export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.7';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
