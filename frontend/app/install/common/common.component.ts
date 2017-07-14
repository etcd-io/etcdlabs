export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.3';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
