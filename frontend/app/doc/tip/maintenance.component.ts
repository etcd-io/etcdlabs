import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

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

@Component({
    selector: 'app-maintenance',
    templateUrl: 'maintenance.component.html',
    styleUrls: ['common/common.component.css'],
})
export class MaintenanceTipComponent extends ParentComponent {
    docVersion: string;

    prometheusVersion: string;
    prometheusDir: string;
    prometheusName: string;
    prometheusPort: number;

    inputEtcdHostsTxt: string;

    grafanaDownloadURL: string;
    grafanaDir: string;

    constructor() {
        super();
        this.docVersion = super.getDocVersion();

        this.prometheusVersion = '1.3.1';
        this.prometheusDir = '$HOME/prometheus';
        this.prometheusName = 'test-etcd';
        this.prometheusPort = 9090;

        this.inputEtcdHostsTxt = `10.240.0.32:2379
10.240.0.33:2379
10.240.0.34:2379`;

        this.grafanaDownloadURL = 'https://grafanarel.s3.amazonaws.com/builds/grafana-4.0.0-1478693311beta1.linux-x64.tar.gz';
        this.grafanaDir = '$HOME/grafana';
    }

    getPrometheusCommand() {
        let divide = getDivider(cleanDir(this.prometheusDir));
        let dirPath = cleanDir(this.prometheusDir) + divide;

        let hs = getLines(this.inputEtcdHostsTxt);

        let hostTxt = ``;
        for (let _i = 0; _i < hs.length; _i++) {
            hostTxt += `'` + hs[_i] + `'`;
            if (_i === hs.length - 1) {
                break;
            }
            hostTxt += ',' + ' ';
        }

        return `# instasll Prometheus
# rm -rf ${cleanDir(this.prometheusDir)}
mkdir -p ${cleanDir(this.prometheusDir)}

FILE_NAME=prometheus-${this.prometheusVersion}.linux-amd64.tar.gz
DOWNLOAD=https://github.com/prometheus/prometheus/releases/download/v${this.prometheusVersion}/` + '${FILE_NAME}' + `

` + 'wget ${DOWNLOAD} -O /tmp/${FILE_NAME}' + `
` + 'tar -xvzf /tmp/${FILE_NAME} --directory' + ' ' + dirPath + ' ' + '--strip-components=1' + `

${dirPath}` + `prometheus -version


# configure Prometheus
cat > ${dirPath}` + this.prometheusName + '.yaml' + `<<EOF
global:
    scrape_interval: 10s
scrape_configs:
    - job_name: ${this.prometheusName}
      static_configs:
      - targets: [${hostTxt}]
EOF
cat ${dirPath}` + this.prometheusName + '.yaml' + `


# set up Prometheus handler
nohup ${dirPath}` + `prometheus` + ' \\' + `
    ` + `-config.file` + ' ' + dirPath + this.prometheusName + '.yaml' + ' \\' + `
    ` + `-web.listen-address ":` + String(this.prometheusPort) + '"' + ' \\' + `
    ` + `-storage.local.path "${dirPath}` + this.prometheusName + '.data"' + ' ' +
            `>>` + ' ' + dirPath + this.prometheusName + '.log' + ' ' + '2>&1 &';
    }

    getGrafanaCommand() {
        let divide = getDivider(cleanDir(this.grafanaDir));
        let dirPath = cleanDir(this.grafanaDir) + divide;

        return `# install Grafana
# rm -rf ${cleanDir(this.grafanaDir)}
mkdir -p ${cleanDir(this.grafanaDir)}
rm -f /tmp/grafana.tar.gz

DOWNLOAD=${this.grafanaDownloadURL}` + `
` + 'wget ${DOWNLOAD} -O /tmp/grafana.tar.gz' + `
tar -xvzf /tmp/grafana.tar.gz --directory ${dirPath} --strip-components=1

${dirPath}bin/grafana-server -v


# configure Grafana
# update configuration file
# vi ${dirPath}conf/defaults.ini
mkdir -p ${dirPath}data


# set up Grafana handler
cd ${dirPath}
nohup ${dirPath}bin/grafana-server web` + ' \\' + `
    ` + '-config' + ' ' + dirPath + 'conf/defaults.ini' +
            ' ' + '>>' + ' ' + dirPath + 'grafana.log' + ' ' + '2>&1 &' + `


# set up Data source in Grafana
<<COMMENT
Name:   ${this.prometheusName}
Type:   Prometheus
Url:    http://localhost:` + String(this.prometheusPort) + `
Access: proxy
COMMENT

`;
    }
}
