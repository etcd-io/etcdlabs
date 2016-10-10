import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { BackendService, ServerStatus, Connect } from './backend.service';

export class KeyValue {
  Key: string;
  Value: string;
  constructor(key: string, value: string) {
    this.Key = key;
    this.Value = value;
  }
}

export class ClientRequest {
  Action: string; // 'write', 'stress', 'get', 'delete', 'stop-node', 'restart-node'
  RangePrefix: boolean; // 'get', 'delete'
  Endpoints: string[];
  KeyValue: KeyValue;

  constructor(
    act: string,
    prefix: boolean,
    eps: string[],
    key: string,
    value: string,
  ) {
    this.Action = act;
    this.RangePrefix = prefix;
    this.Endpoints = eps;
    this.KeyValue = new KeyValue(key, value);
  }
}

export class ClientResponse {
  ClientRequest: ClientRequest;
  Success: boolean;
  Result: string;
  ResultLines: string[];
  KeyValues: KeyValue[];

  constructor(
    clientRequest: ClientRequest,
    success: boolean,
    rs: string,
    rlines: string[],
    kvs: KeyValue[],
  ) {
    this.ClientRequest = clientRequest;
    this.Success = success;
    this.Result = rs;
    this.ResultLines = rlines;
    this.KeyValues = kvs;
  }
}

export class LogLine {
  index: number;
  logLevel: string;
  prefix: string;
  text: string;
  constructor(index: number, logLevel: string, text: string) {
    this.index = index;
    this.logLevel = logLevel;

    let date = new Date();
    let yr = date.getFullYear();
    let mo = date.getMonth() + 1;
    let da = date.getDate();
    let timestamp = date.toTimeString().substring(0, 8);
    let moTxt = String(mo);
    if (moTxt.length === 1) {
      moTxt = '0' + moTxt;
    }
    let daTxt = String(da);
    if (daTxt.length === 1) {
      daTxt = '0' + daTxt;
    }
    let timePrefix = String(yr) + '-' + moTxt + '-' + daTxt + ' ' + timestamp;

    if (logLevel.length === 0) {
      logLevel = 'WARN';
    }
    this.prefix = '[' + timePrefix + ' ' + logLevel + ']';

    this.text = text;
  }
}

@Component({
  selector: 'app-play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
  providers: [BackendService],
})
export class PlayComponent implements OnInit, AfterViewChecked, OnDestroy {
  // $("#logContainer").scrollTop($("#logContainer")[0].scrollHeight);
  @ViewChild('logContainer') private logScrollContainer: ElementRef;

  mode = 'Observable';
  private clientRequestEndpoint = 'client-request';

  logOutputLines: LogLine[];

  selectedTab: number;
  selectedNodes = [true, false, false, false, false];

  wsConn;
  playgroundActive: boolean;
  connect: Connect;
  connectErrorMessage: string;

  serverStatus: ServerStatus;
  serverStatusErrorMessage: string;
  serverStatusHandler;

  inputKey: string;
  inputValue: string;
  deleteReadByPrefix: boolean;

  clientResponse: ClientResponse;
  clientResponseError: string;
  writeResult: string;
  deleteResult: string;
  readResult: string;

  constructor(private backendService: BackendService, private http: Http) {
    this.logOutputLines = [];

    this.selectedTab = 3;

    this.connect = backendService.connect;
    this.connectErrorMessage = '';

    this.serverStatus = backendService.serverStatus;
    this.serverStatusErrorMessage = '';
    this.playgroundActive = this.serverStatus.PlaygroundActive;

    this.inputKey = '';
    this.inputValue = '';
    this.deleteReadByPrefix = false;
  }

  ngOnInit(): void {
    this.playgroundActive = false;
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // user leaaves the template
  ngOnDestroy() {
    console.log('canceling serverStatus handler');
    clearInterval(this.serverStatusHandler);
    this.cancelConnect();
    return;
  }

  scrollToBottom(): void {
    try {
      this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
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
    let txt = 'no endpoint is selected...';
    if (eps.length > 0) {
      txt = 'selected endpoints: ';
      for (let _i = 0; _i < eps.length; _i++) {
        if (_i > 0) {
          txt += ',';
        }
        txt += eps[_i];
      }
    }
    return txt;
  }

  sendLogLine(logLevel: string, txt: string) {
    this.logOutputLines.push(new LogLine(this.logOutputLines.length, logLevel, txt));
  }

  // https://angular.io/docs/ts/latest/guide/template-syntax.html
  trackByLineIndex(index: number, line: LogLine) {
    return line.index;
  }

  ///////////////////////////////////////////////////////
  processConnectResponse(resp: Connect) {
    this.connect = resp;
    this.connectErrorMessage = '';
  }

  startConnect() {
    let connectResult: Connect;
    this.backendService.fetchConnect().subscribe(
      connect => connectResult = connect,
      error => this.connectErrorMessage = <any>error,
      () => this.processConnectResponse(connectResult),
    );
  }

  cancelConnect() {
    let connectResult: Connect;
    this.backendService.deleteConnect().subscribe(
      connect => connectResult = connect,
      error => this.connectErrorMessage = <any>error,
      () => this.processConnectResponse(connectResult),
    );
  }

  clickConnect() {
    if (this.playgroundActive) {
      this.sendLogLine('INFO', 'Already connected to cluster!');
      return;
    }

    this.playgroundActive = true;
    this.sendLogLine('OK', 'Hello World! Connected to etcd cluster!');

    this.startConnect();

    let host = window.location.hostname;
    let port = ':' + String(this.connect.WebPort);
    let backendURL = host + port;
    this.sendLogLine('INFO', 'Connected to backend ' + backendURL);

    // (X) setInterval(this.getServerStatus, 1000);
    this.serverStatusHandler = setInterval(() => this.getServerStatus(), 1000);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  processServerStatusResponse(resp: ServerStatus) {
    this.serverStatus = resp;
    this.serverStatusErrorMessage = '';

    this.playgroundActive = this.serverStatus.PlaygroundActive;

    if (!this.playgroundActive) {
      console.log('canceling serverStatus handler');
      clearInterval(this.serverStatusHandler);
    }
  }

  getServerStatus() {
    let serverStatusResult: ServerStatus;
    this.backendService.fetchServerStatus().subscribe(
      serverStatus => serverStatusResult = serverStatus,
      error => this.serverStatusErrorMessage = <any>error,
      () => this.processServerStatusResponse(serverStatusResult),
    );
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  processClientResponse(resp: ClientResponse) {
    this.clientResponse = resp;

    let logLevel = 'OK';
    if (!this.clientResponse.Success) {
      logLevel = 'WARN';
    }
    if (this.clientResponse.ClientRequest.Action === 'stop-node') {
      logLevel = 'WARN';
    }
    if (this.clientResponse.ClientRequest.Action === 'restart-node') {
      logLevel = 'INFO';
    }

    switch (this.clientResponse.ClientRequest.Action) {
      case 'stress': // fallthrough
      case 'write':
        this.writeResult = this.clientResponse.Result;
        break;

      case 'delete':
        this.deleteResult = this.clientResponse.Result;
        break;

      case 'get':
        this.readResult = this.clientResponse.Result;
        break;
    }

    this.sendLogLine(logLevel, this.clientResponse.Result);

    if (this.clientResponse.ClientRequest.Action !== 'stop-node' && this.clientResponse.ClientRequest.Action !== 'restart-node') {
      for (let _i = 0; _i < this.clientResponse.ResultLines.length; _i++) {
        this.sendLogLine(logLevel, this.clientResponse.ResultLines[_i]);
      }
    }
  }

  processHTTPResponseClient(res: Response) {
    let jsonBody = res.json();
    let clientResponse = <ClientResponse>jsonBody;
    return clientResponse || {};
  }

  processHTTPErrorClient(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    this.clientResponseError = errMsg;
    return Observable.throw(errMsg);
  }

  postClientRequest(clientRequest: ClientRequest): Observable<ClientResponse> {
    let body = JSON.stringify(clientRequest);
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });

    // this returns without waiting for POST response
    let obser = this.http.post(this.clientRequestEndpoint, body, options)
      .map(this.processHTTPResponseClient)
      .catch(this.processHTTPErrorClient);
    return obser;
  }

  processClientRequest(act: string) {
    let eps = this.getSelectedNodeEndpoints();
    let prefix = this.deleteReadByPrefix;
    let key = this.inputKey;
    let val = this.inputValue;

    let nodeIndex = this.selectedTab - 3;
    if (act === 'stop-node' || act === 'restart-node') {
      eps = [this.serverStatus.NodeStatuses[nodeIndex].Endpoint];
      prefix = false;
      key = '';
      val = '';
      this.sendLogLine('OK', 'requested "' + act + '" ' + this.serverStatus.NodeStatuses[nodeIndex].Name);
    } else {
      this.sendLogLine('OK', 'requested "' + act + '" (' + this.getSelectedNodeEndpointsTxt() + ')');
    }

    let clientRequest = new ClientRequest(act, prefix, eps, key, val);
    let clientResponseFromSubscribe: ClientResponse;
    this.postClientRequest(clientRequest).subscribe(
      clientResponse => clientResponseFromSubscribe = clientResponse,
      error => this.clientResponseError = <any>error,
      () => this.processClientResponse(clientResponseFromSubscribe), // on-complete
    );
  }
  ///////////////////////////////////////////////////////
}
