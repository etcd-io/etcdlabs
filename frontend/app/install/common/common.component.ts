export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.4';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
