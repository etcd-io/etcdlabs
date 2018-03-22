export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.3.2';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
