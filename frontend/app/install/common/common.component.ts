export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.1.5';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
