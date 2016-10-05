import { Component, OnInit } from '@angular/core';
import { ServerStatus, ServerStatusService } from './server-status.service';

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
  providers: [ServerStatusService],
})
export class PlayComponent implements OnInit {
  mode = 'Observable';

  selectedTab: number;

  serverStatus: ServerStatus;
  errorMessage: string;

  constructor(private serverService: ServerStatusService) {
    this.selectedTab = 3;
    this.serverStatus = serverService.serverStatus;
  }

  ngOnInit(): void {
    this.fetch();
  }

  selectTab(num: number) {
    this.selectedTab = num;
  }

  clickStop() {
    let displayDate = new Date().toTimeString();
    let nodeIndex = this.selectedTab - 3;
    this.serverStatus.NodeStatuses[nodeIndex].StateTxt = 'Requested to stop ' +
      this.serverStatus.NodeStatuses[nodeIndex].Name + ' at ' + displayDate;
    this.serverStatus.NodeStatuses[nodeIndex].State = 'Stopped';
  }

  clickRestart() {
    let displayDate = new Date().toTimeString();
    let nodeIndex = this.selectedTab - 3;
    this.serverStatus.NodeStatuses[nodeIndex].StateTxt = 'Requested to restart ' +
      this.serverStatus.NodeStatuses[nodeIndex].Name + ' at ' + displayDate;
    this.serverStatus.NodeStatuses[nodeIndex].State = 'Follower';
  }

  fetch() {
    this.serverService.fetchServerStatus().subscribe(
      serverStatus => this.serverStatus = serverStatus,
      error => this.errorMessage = <any>error);

    console.log('fetch got', this.serverStatus);
  }
}
