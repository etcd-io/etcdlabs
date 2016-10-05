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
export class ServerStatusService {
  private statusUrl = 'server-status';

  serverStatus: ServerStatus;
  errorMessage: string;

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

  private processResponse(res: Response) {
    let jsonBody = res.json();
    let statusResult = <ServerStatus>jsonBody;
    return statusResult || {};
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.errorMessage = errMsg;
    return Observable.throw(errMsg);
  }

  fetchServerStatus(): Observable<ServerStatus> {
    return this.http.get(this.statusUrl)
      .map(this.processResponse)
      .catch(this.handleError);
  }
}
