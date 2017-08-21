export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.6';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
