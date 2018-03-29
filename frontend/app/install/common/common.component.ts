export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.3';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
