import { Component, OnInit } from '@angular/core';
import { Headers, RequestOptions } from '@angular/http';
import { BackendService, ServerStatus, ClientRequest, ClientResponse } from './backend.service';

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
  providers: [BackendService],
})
export class PlayComponent implements OnInit {
  mode = 'Observable';

  selectedTab: number;
  selectedNodes = [true, false, false, false, false];

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;

  inputKey: string;
  inputValue: string;

  stressResponse: ClientResponse;
  stressError: string;

  writeResponse: ClientResponse;
  writeError: string;

  deleteResponse: ClientResponse;
  deleteErrpr: string;

  readResponse: ClientResponse;
  readError: string;

  writeResponseTxt: string;
  deleteResponseTxt: string;
  readResponseTxt: string;

  constructor(private backendService: BackendService) {
    this.selectedTab = 3;
    this.serverStatus = backendService.serverStatus;
  }

  ngOnInit(): void {
    this.fetch();
  }

  selectTab(num: number) {
    this.selectedTab = num;
  }

  getSelectedNodeIndexes() {
    let idxs = [];
    for (let _i = 0; _i < this.selectedNodes.length; _i++) {
      if (this.selectedNodes[_i]) {
        idxs.push(_i);
      }
    }
    return idxs;
  }

  getSelectedNodeEndpoints() {
    let idxs = this.getSelectedNodeIndexes();
    let eps = [];
    for (let _i = 0; _i < idxs.length; _i++) {
      eps.push(this.serverStatus.NodeStatuses[idxs[_i]].Endpoint);
    }
    return eps;
  }

  getSelectedNodeEndpointsTxt() {
    let eps = this.getSelectedNodeEndpoints();
    let txt = 'No endpoint is selected...';
    if (eps.length > 0) {
      txt = 'Selected endpoints: ';
      for (let _i = 0; _i < eps.length; _i++) {
        if (_i > 0) {
          txt += ',';
        }
        txt += eps[_i];
      }
    }
    return txt;
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
    // TODO: periodic calls on Observable that is returned by requestServerStatus
    this.backendService.requestServerStatus().subscribe(
      serverStatus => this.serverStatus = serverStatus,
      error => this.serverStatusErrorMessage = <any>error);
  }

  processWrite(inputKey: string, inputValue: string) {
    this.inputKey = inputKey;
    this.inputValue = inputValue;

    let eps = this.getSelectedNodeEndpoints();
    this.backendService.requestWrite(eps, this.inputKey, this.inputValue).subscribe(
      clientResponse => this.writeResponse = clientResponse,
      error => this.writeError = <any>error);

    this.writeResponseTxt = 'processWrite response ' + body;
  }

  processDelete(inputKey: string) {
    this.inputKey = inputKey;

    this.deleteResponseTxt = 'processDelete response ' + this.inputKey;
  }

  processRead(inputKey: string) {
    this.inputKey = inputKey;

    this.readResponseTxt = 'processRead response ' + this.inputKey;
  }
}
