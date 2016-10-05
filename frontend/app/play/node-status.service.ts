import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

// NodeStatus defines etcd node status.
export class NodeStatus {
  Status: string;

  Name: string;
  ID: string;
  Endpoint: string;

  IsLeader: boolean;
  State: string;

  DBSize: number;
  DBSizeTxt: string;
  Hash: number;

  constructor(
    status: string,
    name: string,
    id: string,
    endpoint: string,
    isLeader: boolean,
    state: string,
    dbSize: number,
    dbSizeTxt: string,
    hash: number) {
    this.Status = status;

    this.Name = name;
    this.ID = id;
    this.Endpoint = endpoint;

    this.IsLeader = isLeader;
    this.State = state;

    this.DBSize = dbSize;
    this.DBSizeTxt = dbSizeTxt;
    this.Hash = hash;
  }
}

@Injectable()
export class NodeStatusService {
  nodeStatuses: NodeStatus[];
  errorMessage: string;

  constructor(private http: Http) {
    this.nodeStatuses = [
      new NodeStatus('node1 has not started...', 'node1', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node2 has not started...', 'node2', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node3 has not started...', 'node3', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node4 has not started...', 'node4', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node5 has not started...', 'node5', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
    ];
  }

  fetchNodeStatus(): NodeStatus[] {
    console.log('fetchNodeStatus testing...');
    return this.nodeStatuses;

    // fetchNodeStatus(): Observable<NodeStatus[]> {
    // return this.http
    //   .get(`https://google.com`)
    //   .map((r: Response) => r.json().data as NodeStatus[]);
  }
}
