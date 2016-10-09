import { Component, OnInit } from '@angular/core';
import { BackendService, ServerStatus, KeyValue, ClientRequest, ClientResponse } from './backend.service';

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
  deleteReadByPrefix: boolean;

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
    this.serverStatusErrorMessage = '';
    this.inputKey = '';
    this.inputValue = '';
    this.deleteReadByPrefix = false;
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

  fetch() {
    // TODO: periodic calls on Observable that is returned by requestServerStatus
    this.backendService.requestServerStatus().subscribe(
      serverStatus => this.serverStatus = serverStatus,
      error => this.serverStatusErrorMessage = <any>error);
  }

  processClientRequest(act: string) {
    let nodeIndex = this.selectedTab - 3;
    let eps = this.getSelectedNodeEndpoints();
    let prefix = this.deleteReadByPrefix;
    let key = this.inputKey;
    let val = this.inputValue;
    if (act === 'stop-node' || act === 'restart-node') {
      eps = [this.serverStatus.NodeStatuses[nodeIndex].Endpoint];
      prefix = false;
      key = '';
      val = '';
    }

    let clientRequest = new ClientRequest(act, prefix, eps, key, val);
    this.backendService.sendClientRequest(clientRequest).subscribe(
      clientResponse => this.writeResponse = clientResponse,
      error => this.writeError = <any>error);
  }
}
