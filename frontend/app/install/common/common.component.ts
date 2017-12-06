export class ParentComponent {
    latestReleaseVersion: string;
    constructor() {
        this.latestReleaseVersion = 'v3.2.11';
    }
    getLatestReleaseVersion() {
        return this.latestReleaseVersion;
    }
}
