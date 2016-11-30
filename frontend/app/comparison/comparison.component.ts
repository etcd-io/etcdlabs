import { Component, AfterContentInit } from '@angular/core';

import { Http } from '@angular/http';
import { TesterMetricsService, TesterStatus, MetricsResponse } from './tester-metrics.service';

@Component({
    selector: 'app-comparison',
    templateUrl: 'comparison.component.html',
    styleUrls: ['common.component.css'],
    providers: [TesterMetricsService],
})
export class ComparisonComponent implements AfterContentInit {
    metricsLastUpdate: string;
    metricsSuccess: boolean;
    metricsResult: string;
    metricsErrorMessage: string;

    status5Node: TesterStatus;
    status5NodeFailpoints: TesterStatus;

    constructor(private metricsService: TesterMetricsService, private http: Http) {
        this.metricsLastUpdate = '';
        this.metricsSuccess = true;
        this.metricsResult = '';
        this.metricsErrorMessage = '';

        this.status5Node = new TesterStatus('5-node', 0, 0, 0);
        this.status5NodeFailpoints = new TesterStatus('5-node failpoints', 0, 0, 0);
    }

    ngAfterContentInit() {
        console.log('getting initial tester status');
        this.clickRefresh();
    }

    processMetricsResponse(resp: MetricsResponse) {
        this.metricsLastUpdate = resp.LastUpdate;
        this.metricsSuccess = resp.Success;
        this.metricsResult = resp.Result;

        if (String(this.metricsResult) !== 'metrics is disabled') {
            for (let _i = 0; _i < resp.Statuses.length; _i++) {
                let status = resp.Statuses[_i];
                if (status.Name === '5-node') {
                    this.status5Node = status;
                } else if (status.Name === '5-node-failpoints') {
                    this.status5NodeFailpoints = status;
                };
            };
        };
    };

    clickRefresh() {
        let metricsResponse: MetricsResponse;
        this.metricsService.fetchMetrics().subscribe(
            fetchedMetrics => metricsResponse = fetchedMetrics,
            error => this.metricsErrorMessage = <any>error,
            () => this.processMetricsResponse(metricsResponse),
        );
    };
}
