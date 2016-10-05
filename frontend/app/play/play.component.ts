import { Component, OnInit } from '@angular/core';
import { NodeStatus, NodeStatusService } from './node-status.service';

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
  providers: [NodeStatusService],
})
export class PlayComponent implements OnInit {
  selectedTab: number;

  nodeStatuses: NodeStatus[];
  errorMessage: string;

  constructor(private nodeStatusService: NodeStatusService) {
    this.selectedTab = 3;
  }

  ngOnInit(): void {
    this.nodeStatuses = this.nodeStatusService.fetchNodeStatus();
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
