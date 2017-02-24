export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.1.2';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
