export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.5';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
