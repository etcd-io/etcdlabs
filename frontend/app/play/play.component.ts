import { Component } from '@angular/core';


export class NodeStatus {
  Name: string;
  ID: string;
  Endpoint: string;

  IsLeader: boolean;
  State: string;

  DBSize: number;
  DBSizeTxt: string;
  Hash: number;

  constructor(
    name: string,
    id: string,
    endpoint: string,
    isLeader: boolean,
    state: string,
    dbSize: number,
    dbSizeTxt: string,
    hash: number) {
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
      new NodeStatus('node1', 'None', 'None', false, 'Follower', 0, '0 B', 0),
      new NodeStatus('node2', 'None', 'None', false, 'Follower', 0, '0 B', 0),
      new NodeStatus('node3', 'None', 'None', false, 'Follower', 0, '0 B', 0),
      new NodeStatus('node4', 'None', 'None', false, 'Follower', 0, '0 B', 0),
      new NodeStatus('node5', 'None', 'None', false, 'Follower', 0, '0 B', 0),
    ];
  }

  selectTab(num: number) {
    this.selectedTab = num;
  }
}
