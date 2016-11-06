function cleanDir(dir: string) {
    let ds = dir;
    if (ds === undefined) {
        return '';
    }
    if (ds !== '/' && ds.endsWith('/')) {
        ds = ds.substring(0, ds.length - 1);
    }
    return ds;
}

function getDivider(execDir: string) {
    let divider = '/';
    if (execDir === undefined || execDir === '/') {
        divider = '';
    }
    return divider;
}

export class Rkt {
    version: string;
    execDir: string;

    fetchURLPrefixToTrust: string;
    publicKeyToTrust: string;
    customACI: string;

    constructor(
        version: string,
        execDir: string,

        fetchURLPrefixToTrust: string,
        publicKeyToTrust: string,
        customACI: string,
    ) {
        this.version = version;
        this.execDir = execDir;

        this.fetchURLPrefixToTrust = fetchURLPrefixToTrust;
        this.publicKeyToTrust = publicKeyToTrust;
        this.customACI = customACI;
    }

    getExecDir() {
        return cleanDir(this.execDir);
    }

    stripVersion() {
        return this.version.substring(1)
    }

    getTrustCommandLinux() {
        let divide = getDivider(this.execDir);
        let lineBreak = ' \\' + `
    `;

        let exec = 'sudo' + ' ' + this.getExecDir() + divide + 'rkt' + ' ' + 'trust' + lineBreak;
        exec += '--prefix' + ' ' + this.fetchURLPrefixToTrust + lineBreak;
        exec += `'` + this.publicKeyToTrust + `'`;

        return exec;
    }

    getInstallCommandLinux() {
        let divide = getDivider(this.execDir);

        let txt = `RKT_VERSION=${this.version}

GITHUB_URL=https://github.com/coreos/rkt/releases/download

` + 'DOWNLOAD_URL=${GITHUB_URL}' + `

`;

        txt += 'rm -f /tmp/rkt-${RKT_VERSION}.tar.gz' + `
` + 'rm -rf /tmp/test-rkt-${RKT_VERSION} && mkdir -p /tmp/test-rkt-${RKT_VERSION}' + `

` + 'curl -L ${DOWNLOAD_URL}/${RKT_VERSION}/rkt-${RKT_VERSION}.tar.gz -o /tmp/rkt-${RKT_VERSION}.tar.gz' + `
` + 'tar xzvf /tmp/rkt-${RKT_VERSION}.tar.gz -C /tmp/test-rkt-${RKT_VERSION} --strip-components=1' + `

`;
        if (this.execDir === '/') {
            txt += '# sudo cp /tmp/test-rkt-${RKT_VERSION}/rkt /usr/local/bin' + `
`;
        }
        txt += 'sudo cp /tmp/test-rkt-${RKT_VERSION}/rkt ' + this.execDir + `

` + this.execDir + divide + `rkt version`;

        return txt;
    }
}
