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

@Injectable()
export class BackendService {
  private serverStatusEndpoint = 'server-status';
  // private clientRequestEndpoint = 'client-request';

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;

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
  // with Observable
  //
  private processHTTPResponseServerStatis(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ServerStatus>jsonBody;
    return statusResult || {};
  }
  private processHTTPErrorServerStatus(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.serverStatusErrorMessage = errMsg;
    return Observable.throw(errMsg);
  }
  fetchServerStatus(): Observable<ServerStatus> {
    return this.http.get(this.serverStatusEndpoint)
      .map(this.processHTTPResponseServerStatis)
      .catch(this.processHTTPErrorServerStatus);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  // with Promise
  //
  // private processHTTPResponseClient(res: Response) {
  //   let jsonBody = res.json();
  //   let clientResponse = <ClientResponse>jsonBody;
  //   return clientResponse || {};
  // }
  // private processHTTPErrorClient(error: any) {
  //   let errMsg = (error.message) ? error.message :
  //     error.status ? `${error.status} - ${error.statusText}` : 'Server error';
  //   console.error(errMsg);
  //   this.clientResponseError = errMsg;
  //   return Promise.reject(errMsg);
  // }
  // postClientRequest(clientRequest: ClientRequest): Promise<ClientResponse> {
  //   let body = JSON.stringify(clientRequest);
  //   let headers = new Headers({ 'Content-Type': 'application/json' });
  //   let options = new RequestOptions({ headers: headers });
  //   return this.http.post(this.clientRequestEndpoint, body, options)
  //     .toPromise()
  //     .then(this.processHTTPResponseClient)
  //     .catch(this.processHTTPErrorClient);
  // }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  // with Observable
  //
  // private processHTTPResponseClient(res: Response) {
  //   let jsonBody = res.json();
  //   let clientResponse = <ClientResponse>jsonBody;
  //   console.log('clientResponse', clientResponse);
  //   return clientResponse || {};
  // }
  // private processHTTPErrorClient(error: any) {
  //   let errMsg = (error.message) ? error.message :
  //     error.status ? `${error.status} - ${error.statusText}` : 'Server error';
  //   console.error(errMsg);
  //   this.clientResponseError = errMsg;
  //   return Observable.throw(errMsg);
  // }
  // postClientRequest(clientRequest: ClientRequest): Observable<ClientResponse> {
  //   let body = JSON.stringify(clientRequest);
  //   let headers = new Headers({ 'Content-Type': 'application/json' });
  //   let options = new RequestOptions({ headers: headers });
  //
  //   // this returns without waiting for POST response
  //   let obser = this.http.post(this.clientRequestEndpoint, body, options)
  //     .map(this.processHTTPResponseClient)
  //     .catch(this.processHTTPErrorClient);
  //   return obser;
  // }
  ///////////////////////////////////////////////////////
}
