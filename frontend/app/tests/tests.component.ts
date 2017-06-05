import { Component, AfterContentInit } from '@angular/core';

import { Http } from '@angular/http';
import { TesterRecordService, TesterStatus, RecordResponse } from './tester-record.service';

@Component({
    selector: 'app-tests',
    templateUrl: 'tests.component.html',
    styleUrls: ['common.component.css'],
    providers: [TesterRecordService],
})
export class TestsComponent implements AfterContentInit {
    recordSince: string;
    recordSuccess: boolean;
    recordResult: string;
    recordErrorMessage: string;

    status5Node: TesterStatus;
    status5NodeFailpoints: TesterStatus;

    constructor(private metricsService: TesterRecordService, private http: Http) {
        this.recordSince = '';
        this.recordSuccess = true;
        this.recordResult = '';
        this.recordErrorMessage = '';

        this.status5Node = new TesterStatus('5-node', '0', '0');
        this.status5NodeFailpoints = new TesterStatus('5-node failpoints', '0', '0');
    }

    ngAfterContentInit() {
        console.log('getting initial tester status');
        this.clickRefresh();
    }

    processRecordResponse(resp: RecordResponse) {
        this.recordSince = resp.Since;
        this.recordSuccess = resp.Success;
        this.recordResult = resp.Result;

        if (String(this.recordResult) !== 'record is disabled') {
            for (let _i = 0; _i < resp.Statuses.length; _i++) {
                let status = resp.Statuses[_i];
                if (_i === 0) {
                    this.status5Node = status;
                } else if (_i === 1) {
                    this.status5NodeFailpoints = status;
                };
            };
        };
    };

    clickRefresh() {
        let recordResponse: RecordResponse;
        this.metricsService.getRecord().subscribe(
            gotRecord => recordResponse = gotRecord,
            error => this.recordErrorMessage = <any>error,
            () => this.processRecordResponse(recordResponse),
        );
    };
}
