import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

// Connect contains initial server state.
export class Connect {
  WebPort: number;
  constructor(webPort: number) {
    this.WebPort = webPort;
  }
}

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
  PlaygroundActive: boolean;
  ServerUptime: string;
  NodeStatuses: NodeStatus[];
  constructor(active: boolean, serverUptime: string, nodeStatuses: NodeStatus[]) {
    this.PlaygroundActive = active;
    this.ServerUptime = serverUptime;
    this.NodeStatuses = nodeStatuses;
  }
}

@Injectable()
export class BackendService {
  private connectEndpoint = 'conn';
  private serverStatusEndpoint = 'server-status';
  // private clientRequestEndpoint = 'client-request';

  connect: Connect;
  connectErrorMessage: string;

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;

  constructor(private http: Http) {
    this.connect = new Connect(2200);

    let nodeStatuses = [
      new NodeStatus('node1', 'None', 'None', false, 'Stopped', 'node1 has not started...', 0, '0 B', 0),
      new NodeStatus('node2', 'None', 'None', false, 'Stopped', 'node2 has not started...', 0, '0 B', 0),
      new NodeStatus('node3', 'None', 'None', false, 'Stopped', 'node3 has not started...', 0, '0 B', 0),
      new NodeStatus('node4', 'None', 'None', false, 'Stopped', 'node4 has not started...', 0, '0 B', 0),
      new NodeStatus('node5', 'None', 'None', false, 'Stopped', 'node5 has not started...', 0, '0 B', 0),
    ];
    this.serverStatus = new ServerStatus(false, '0s', nodeStatuses);
  }

  ///////////////////////////////////////////////////////
  private processHTTPResponseConnect(res: Response) {
    let jsonBody = res.json();
    let rs = <Connect>jsonBody;
    return rs || {};
  }
  private processHTTPErrorConnect(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.connectErrorMessage = errMsg;
    return Observable.throw(errMsg);
  }
  fetchConnect(): Observable<Connect> {
    return this.http.get(this.connectEndpoint)
      .map(this.processHTTPResponseConnect)
      .catch(this.processHTTPErrorConnect);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  private processHTTPResponseServerStatus(res: Response) {
    let jsonBody = res.json();
    let rs = <ServerStatus>jsonBody;
    return rs || {};
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
      .map(this.processHTTPResponseServerStatus)
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
