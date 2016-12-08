import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

export class TesterStatus {
    Name: string;
    TotalCase: string;
    CurrentCase: string;
    CurrentFailed: string;

    constructor(
        name: string,
        totalCase: string,
        currentCase: string,
        currentFailed: string,
    ) {
        this.Name = name;
        this.TotalCase = totalCase;
        this.CurrentCase = currentCase;
        this.CurrentFailed = currentFailed;
    }
}

export class MetricsResponse {
    Success: boolean;
    Result: string;
    LastUpdate: string;
    Statuses: TesterStatus[];

    constructor(
        success: boolean,
        result: string,
        lastUpdate: string,
        statuses: TesterStatus[],
    ) {
        this.Success = success;
        this.Result = result;
        this.LastUpdate = lastUpdate;
        this.Statuses = statuses;
    }
}

@Injectable()
export class TesterMetricsService {
    private fetchMetricsEndpoint = 'fetch-metrics';
    metricsResponse: MetricsResponse;

    constructor(private http: Http) {
    }

    private processHTTPResponseServerStatus(res: Response) {
        let jsonBody = res.json();
        let rs = <MetricsResponse>jsonBody;
        return rs || {};
    }
    private processHTTPErrorServerStatus(error: any) {
        console.error(error);
        return Observable.throw(error);
    }
    fetchMetrics(): Observable<MetricsResponse> {
        return this.http.get(this.fetchMetricsEndpoint)
            .map(this.processHTTPResponseServerStatus)
            .catch(this.processHTTPErrorServerStatus);
    }
}
