import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

// NodeStatus defines etcd node status.
export class NodeStatus {
  Name: string;
  ID: string;
  Endpoint: string;

  IsLeader: boolean;
  State: string;
  StateTxt: string;

  DBSize: number;
  DBSizeTxt: string;
  Hash: number;

  constructor(
    name: string,
    id: string,
    endpoint: string,
    isLeader: boolean,
    state: string,
    stateTxt: string,
    dbSize: number,
    dbSizeTxt: string,
    hash: number,
  ) {
    this.Name = name;
    this.ID = id;
    this.Endpoint = endpoint;

    this.IsLeader = isLeader;
    this.State = state;
    this.StateTxt = stateTxt;

    this.DBSize = dbSize;
    this.DBSizeTxt = dbSizeTxt;
    this.Hash = hash;
  }
}

// ServerStatus defines etcd server status.
export class ServerStatus {
  ServerUptime: string;
  NodeStatuses: NodeStatus[];
  constructor(serverUptime: string, nodeStatuses: NodeStatus[]) {
    this.ServerUptime = serverUptime;
    this.NodeStatuses = nodeStatuses;
  }
}

export class KeyValue {
  Key: string;
  Value: string;
  constructor(key: string, value: string) {
    this.Key = key;
    this.Value = value;
  }
}

export class ClientRequest {
  Action: string;
  RangePrefix: boolean;
  Endpoints: string[];
  KeyValue: KeyValue;

  constructor(
    act: string,
    prefix: boolean,
    eps: string[],
    key: string,
    value: string,
  ) {
    this.Action = act;
    this.RangePrefix = prefix;
    this.Endpoints = eps;
    this.KeyValue = new KeyValue(key, value);
  }
}

export class ClientResponse {
  Success: boolean;
  Result: string;
  ResultLines: string[];
  KeyValues: KeyValue[];

  constructor(
    success: boolean,
    rs: string,
    rlines: string[],
    kvs: KeyValue[],
  ) {
    this.Success = success;
    this.Result = rs;
    this.ResultLines = rlines;
    this.KeyValues = kvs;
  }
}

@Injectable()
export class BackendService {
  private statusUrl = 'server-status';
  private clientUrl = 'client-request';

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;

  writeResponse: string;
  writeError: string;

  deleteResponse: string;
  deleteErrpr: string;

  readResponse: string;
  readError: string;

  constructor(private http: Http) {
    let nodeStatuses = [
      new NodeStatus('node1', 'None', 'None', false, 'Stopped', 'node1 has not started...', 0, '0 B', 0),
      new NodeStatus('node2', 'None', 'None', false, 'Stopped', 'node2 has not started...', 0, '0 B', 0),
      new NodeStatus('node3', 'None', 'None', false, 'Stopped', 'node3 has not started...', 0, '0 B', 0),
      new NodeStatus('node4', 'None', 'None', false, 'Stopped', 'node4 has not started...', 0, '0 B', 0),
      new NodeStatus('node5', 'None', 'None', false, 'Stopped', 'node5 has not started...', 0, '0 B', 0),
    ];
    this.serverStatus = new ServerStatus('0s', nodeStatuses);
  }

  ///////////////////////////////////////////////////////
  private processServerStatusResponse(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ServerStatus>jsonBody;
    return statusResult || {};
  }

  private processServerStatusError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.serverStatusErrorMessage = errMsg;

    for (let _i = 0; _i < this.serverStatus.NodeStatuses.length; _i++) {
      this.serverStatus.NodeStatuses[_i].State = 'Stopped';
      this.serverStatus.NodeStatuses[_i].StateTxt = this.serverStatus.NodeStatuses[_i].Name + ' is not reachable...';
    }

    return Observable.throw(errMsg);
  }

  requestServerStatus(): Observable<ServerStatus> {
    return this.http.get(this.statusUrl)
      .map(this.processServerStatusResponse)
      .catch(this.processServerStatusError);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  private processWriteResponse(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ClientResponse>jsonBody;
    return statusResult || {};
  }

  private processWriteError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.serverStatusErrorMessage = errMsg;

    return Observable.throw(errMsg);
  }

  requestWrite(eps: string[], key: string, value: string): Observable<ClientResponse> {
    return this.http.get(this.clientUrl)
      .map(this.processWriteResponse)
      .catch(this.processWriteError);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  private processDeleteResponse(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ClientResponse>jsonBody;
    return statusResult || {};
  }

  private processDeleteError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.serverStatusErrorMessage = errMsg;

    return Observable.throw(errMsg);
  }

  requestDelete(): Observable<ClientResponse> {
    return this.http.get(this.clientUrl)
      .map(this.processDeleteResponse)
      .catch(this.processDeleteError);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  private processReadResponse(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ClientResponse>jsonBody;
    return statusResult || {};
  }

  private processReadError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.serverStatusErrorMessage = errMsg;

    return Observable.throw(errMsg);
  }

  requestRead(): Observable<ClientResponse> {
    return this.http.get(this.clientUrl)
      .map(this.processReadResponse)
      .catch(this.processReadError);
  }
  ///////////////////////////////////////////////////////
}
