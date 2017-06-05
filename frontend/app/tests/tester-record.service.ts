import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

export class TesterStatus {
    Endpoint: string;
    CurrentCase: string;
    CurrentFailed: string;

    constructor(
        endpoint: string,
        currentCase: string,
        currentFailed: string,
    ) {
        this.Endpoint = endpoint;
        this.CurrentCase = currentCase;
        this.CurrentFailed = currentFailed;
    }
}

export class RecordResponse {
    Success: boolean;
    Result: string;
    Since: string;
    TotalCase: string;
    Statuses: TesterStatus[];

    constructor(
        success: boolean,
        result: string,
        since: string,
        totalCase: string,
        statuses: TesterStatus[],
    ) {
        this.Success = success;
        this.Result = result;
        this.Since = since;
        this.TotalCase = totalCase;
        this.Statuses = statuses;
    }
}

@Injectable()
export class TesterRecordService {
    private getRecordEndpoint = 'get-record';
    recordResponse: RecordResponse;

    constructor(private http: Http) {
    }

    private processHTTPResponseServerStatus(res: Response) {
        let jsonBody = res.json();
        let rs = <RecordResponse>jsonBody;
        return rs || {};
    }
    private processHTTPErrorServerStatus(error: any) {
        console.error(error);
        return Observable.throw(error);
    }
    getRecord(): Observable<RecordResponse> {
        return this.http.get(this.getRecordEndpoint)
            .map(this.processHTTPResponseServerStatus)
            .catch(this.processHTTPErrorServerStatus);
    }
}
