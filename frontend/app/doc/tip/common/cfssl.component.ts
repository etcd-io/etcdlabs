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

export class CFSSL {
    version: string;
    execDir: string;
    srcCertsDir: string;

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

    getCertsDir() {
        return cleanDir(this.srcCertsDir);
    }

    getInstallCommand() {
        let divide = getDivider(this.execDir);

        return `rm -f /tmp/cfssl* && rm -rf /tmp/test-certs && mkdir -p /tmp/test-certs

curl -L https://pkg.cfssl.org/${this.version}/cfssl_linux-amd64 -o /tmp/cfssl
chmod +x /tmp/cfssl
sudo mv /tmp/cfssl ` + this.execDir + `/cfssl

curl -L https://pkg.cfssl.org/${this.version}/cfssljson_linux-amd64 -o /tmp/cfssljson
chmod +x /tmp/cfssljson
sudo mv /tmp/cfssljson ` + this.execDir + `/cfssljson

` + this.execDir + divide + `cfssl version
` + this.execDir + divide + `cfssljson -h

mkdir -p ${this.getCertsDir()}
`;
    }

    getRootCACommand() {
        return `cat > ${this.getCertsDir()}/trusted-ca-csr.json <<EOF
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

cfssl gencert --initca=true ${this.getCertsDir()}/trusted-ca-csr.json | cfssljson --bare ${this.getCertsDir()}/trusted-ca

# verify
openssl x509 -in ${this.getCertsDir()}/trusted-ca.pem -text -noout
`;
    }

    getRootCACommandResult() {
        return `# CSR configuration
${this.getCertsDir()}/trusted-ca-csr.json

# CSR
${this.getCertsDir()}/trusted-ca.csr

# private key
${this.getCertsDir()}/trusted-ca-key.pem

# public key
${this.getCertsDir()}/trusted-ca.pem`;
    }

    getGenCertConfig() {
        return `cat > ${this.getCertsDir()}/gencert-config.json <<EOF
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
EOF`;
    }

    getGenCertCommand(name: string, host: string, moreHostsTxt: string) {
        let hosts: string[] = ['127.0.0.1', 'localhost'];
        if (host !== '' && host !== 'localhost') {
            hosts.push(host);
        }
        if (moreHostsTxt !== '') {
            let hs = moreHostsTxt.split(/\r?\n/);
            // hosts = hosts.concat(hs);
            for (let _i = 0; _i < hs.length; _i++) {
                if (hs[_i] !== '') {
                    hosts.push(hs[_i]);
                }
            }
        }

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
  "CN": "${this.commonName}",
  "hosts": [
${hostTxt}
  ]
}
EOF

cfssl gencert` + ' \\' + `
    --ca ${this.getCertsDir()}/trusted-ca.pem` + ' \\' + `
    --ca-key ${this.getCertsDir()}/trusted-ca-key.pem` + ' \\' + `
    --config ${this.getCertsDir()}/gencert-config.json` + ' \\' + `
    ` + `${this.getCertsDir()}/${name}-ca-csr.json | cfssljson --bare ${this.getCertsDir()}/${name}`;
    }

    getCertsCopyCommand(dstCertsDir: string) {
        return `# after transferring certs to remote machines

sudo mkdir -p ${cleanDir(dstCertsDir)}
sudo chown -R root:$(whoami) ${cleanDir(dstCertsDir)}
sudo chmod -R a+rw ${cleanDir(dstCertsDir)}

sudo cp ${this.getCertsDir()}/* ${cleanDir(dstCertsDir)}`;
    }
}
