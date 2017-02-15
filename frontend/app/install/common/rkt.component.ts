function getDivider(execDir: string) {
    let divider = '/';
    if (execDir === undefined || execDir === '/') {
        divider = '';
    }
    return divider;
}

function cleanDir(dir: string) {
    let ds = dir;
    if (ds === undefined) {
        return '';
    }
    if (ds !== '/' && String(ds).endsWith('/')) {
        ds = String(ds).substring(0, ds.length - 1);
    }
    return ds;
}

export class Rkt {
    version: string;
    execDir: string;

    constructor(
        version: string,
        execDir: string,
    ) {
        this.version = version;
        this.execDir = execDir;
    }

    getExecDir() {
        return cleanDir(this.execDir);
    }

    stripVersion() {
        return this.version.substring(1)
    }
}
