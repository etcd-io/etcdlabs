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
    if (ds !== '/' && ds.endsWith('/')) {
        ds = ds.substring(0, ds.length - 1);
    }
    return ds;
}

function getLines(txt: string) {
    let lines: string[] = [];
    if (txt !== '') {
        let ls = txt.split(/\r?\n/);
        for (let _i = 0; _i < ls.length; _i++) {
            if (ls[_i] !== '') {
                lines.push(ls[_i]);
            }
        }
    }
    return lines;
}

export class CFSSL {
    version: string;
    execDir: string;
    srcCertsDir: string;

    rootCAPrefix: string;
    gencertFileName: string;

    organization: string;
    organizationUnit: string;
    locationCity: string;
    locationState: string;
    locationCountry: string;

    keyAlgorithm: string;
    keySize: number;
    keyExpirationHour: number;

    commonName: string;

    constructor(
        version: string,
        execDir: string,
        srcCertsDir: string,

        rootCAPrefix: string,
        gencertFileName: string,

        organization: string,
        organizationUnit: string,
        locationCity: string,
        locationState: string,
        locationCountry: string,

        keyAlgorithm: string,
        keySize: number,
        keyExpirationHour: number,

        commonName: string,
    ) {
        this.version = version;
        this.execDir = execDir;
        this.srcCertsDir = srcCertsDir;

        this.rootCAPrefix = rootCAPrefix;
        this.gencertFileName = gencertFileName;

        this.organization = organization;
        this.organizationUnit = organizationUnit;
        this.locationCity = locationCity;
        this.locationState = locationState;
        this.locationCountry = locationCountry;

        this.keyAlgorithm = keyAlgorithm;
        this.keySize = keySize;
        this.keyExpirationHour = keyExpirationHour;

        this.commonName = commonName;
    }

    getExecDir() {
        return cleanDir(this.execDir);
    }

    getCertsDir() {
        return cleanDir(this.srcCertsDir);
    }

    getInstallCommand() {
        let divide = getDivider(this.getExecDir());

        return `rm -f /tmp/cfssl* && rm -rf /tmp/certs && mkdir -p /tmp/certs

curl -L https://pkg.cfssl.org/${this.version}/cfssl_linux-amd64 -o /tmp/cfssl
chmod +x /tmp/cfssl
sudo mv /tmp/cfssl ` + this.getExecDir() + `/cfssl

curl -L https://pkg.cfssl.org/${this.version}/cfssljson_linux-amd64 -o /tmp/cfssljson
chmod +x /tmp/cfssljson
sudo mv /tmp/cfssljson ` + this.getExecDir() + `/cfssljson

` + this.getExecDir() + divide + `cfssl version
` + this.getExecDir() + divide + `cfssljson -h

mkdir -p ${this.getCertsDir()}
`;
    }

    getRootCACommand() {
        return `cat > ${this.getCertsDir()}/${this.rootCAPrefix}-csr.json <<EOF
{
  "key": {
    "algo": "${this.keyAlgorithm}",
    "size": ${this.keySize}
  },
  "names": [
    {
      "O": "${this.organization}",
      "OU": "${this.organizationUnit}",
      "L": "${this.locationCity}",
      "ST": "${this.locationState}",
      "C": "${this.locationCountry}"
    }
  ],
  "CN": "${this.commonName}"
}
EOF

cfssl gencert --initca=true ${this.getCertsDir()}/${this.rootCAPrefix}-csr.json | cfssljson --bare ${this.getCertsDir()}/${this.rootCAPrefix}

# verify
openssl x509 -in ${this.getCertsDir()}/${this.rootCAPrefix}.pem -text -noout


# cert-generation configuration
cat > ${this.getCertsDir()}/${this.gencertFileName} <<EOF
{
  "signing": {
    "default": {
        "usages": [
          "signing",
          "key encipherment",
          "server auth",
          "client auth"
        ],
        "expiry": "${this.keyExpirationHour}h"
    }
  }
}
EOF

`;
    }

    getRootCACommandResult() {
        return `# CSR configuration
${this.getCertsDir()}/${this.rootCAPrefix}-csr.json

# CSR
${this.getCertsDir()}/${this.rootCAPrefix}.csr

# self-signed root CA private key
${this.getCertsDir()}/${this.rootCAPrefix}-key.pem

# self-signed root CA public key
${this.getCertsDir()}/${this.rootCAPrefix}.pem

# cert-generation configuration for other TLS assets
${this.getCertsDir()}/${this.gencertFileName}
`;
    }

    getGenCertCommand(name: string, commonName: string, host: string, moreHostsTxt: string) {
        let hosts: string[] = ['127.0.0.1', 'localhost'];
        if (host !== '' && host !== 'localhost') {
            hosts.push(host);
        }
        hosts = hosts.concat(getLines(moreHostsTxt));

        let hostTxt = `    `;
        let lineBreak = `
    `;
        for (let _i = 0; _i < hosts.length; _i++) {
            hostTxt += '"' + hosts[_i] + '"';
            if (_i === hosts.length - 1) {
                break;
            }
            hostTxt += ',' + lineBreak;
        }

        return `cat > ${this.getCertsDir()}/${name}-ca-csr.json <<EOF
{
  "key": {
    "algo": "${this.keyAlgorithm}",
    "size": ${this.keySize}
  },
  "names": [
    {
      "O": "${this.organization}",
      "OU": "${this.organizationUnit}",
      "L": "${this.locationCity}",
      "ST": "${this.locationState}",
      "C": "${this.locationCountry}"
    }
  ],
  "CN": "${commonName}",
  "hosts": [
${hostTxt}
  ]
}
EOF

cfssl gencert` + ' \\' + `
    --ca ${this.getCertsDir()}/${this.rootCAPrefix}.pem` + ' \\' + `
    --ca-key ${this.getCertsDir()}/${this.rootCAPrefix}-key.pem` + ' \\' + `
    --config ${this.getCertsDir()}/${this.gencertFileName}` + ' \\' + `
    ` + `${this.getCertsDir()}/${name}-ca-csr.json | cfssljson --bare ${this.getCertsDir()}/${name}

`;
    }

    getCertsPrepareCommand(dstCertsDir: string) {
        return `# after transferring certs to remote machines

sudo mkdir -p ${cleanDir(dstCertsDir)}
sudo chown -R root:$(whoami) ${cleanDir(dstCertsDir)}
sudo chmod -R a+rw ${cleanDir(dstCertsDir)}

sudo cp ${this.getCertsDir()}/* ${cleanDir(dstCertsDir)}`;
    }

    getCFSSLFilesTxt(dstCertsDir: string, name: string) {
        let lineBreak = `
`;
        let txt = '';
        txt += cleanDir(dstCertsDir) + `/` + name + '-ca-csr.json' + lineBreak;
        txt += cleanDir(dstCertsDir) + `/` + name + '.csr' + lineBreak;
        txt += cleanDir(dstCertsDir) + `/` + name + '-key.pem' + lineBreak;
        txt += cleanDir(dstCertsDir) + `/` + name + '.pem';
        return txt;
    }
}
