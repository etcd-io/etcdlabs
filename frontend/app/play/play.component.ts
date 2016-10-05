import { Component } from '@angular/core';


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

@Component({
  selector: 'play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
})
export class PlayComponent {
  selectedTab: number;
  nodeStatuses: NodeStatus[];
  constructor() {
    this.selectedTab = 3;
    this.nodeStatuses = [
      new NodeStatus('node1 has not started...', 'node1', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node2 has not started...', 'node2', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node3 has not started...', 'node3', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node4 has not started...', 'node4', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
      new NodeStatus('node5 has not started...', 'node5', 'None', 'None', false, 'Stopped', 0, '0 B', 0),
    ];
  }

  selectTab(num: number) {
    this.selectedTab = num;
  }

  clickStop() {
    let displayDate = new Date().toTimeString();
    let nodeIndex = this.selectedTab - 3;
    this.nodeStatuses[nodeIndex].Status = 'Requested to stop ' + this.nodeStatuses[nodeIndex].Name + ' at ' + displayDate;
    this.nodeStatuses[nodeIndex].State = 'Stopped';

    console.log('clickStop', this.nodeStatuses[nodeIndex]);
  }

  clickRestart() {
    let displayDate = new Date().toTimeString();
    let nodeIndex = this.selectedTab - 3;
    this.nodeStatuses[nodeIndex].Status = 'Requested to restart ' + this.nodeStatuses[nodeIndex].Name + ' at ' + displayDate;
    this.nodeStatuses[nodeIndex].State = 'Follower';

    console.log('clickRestart', this.nodeStatuses[nodeIndex]);
  }

  fetchNodeStatus() {
    console.log('fetching node status...');
  }
}
