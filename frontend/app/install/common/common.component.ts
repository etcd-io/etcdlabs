export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.9';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
