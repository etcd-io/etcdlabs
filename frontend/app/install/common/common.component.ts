export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.5';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
