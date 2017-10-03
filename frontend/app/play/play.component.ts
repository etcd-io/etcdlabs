import { Component, OnInit, AfterContentInit, AfterViewChecked, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { BackendService, ServerStatus, MemberStatus, Connect } from './backend.service';

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
export class PlayComponent implements OnInit, AfterContentInit, AfterViewChecked, OnDestroy {
  // $("#logContainer").scrollTop($("#logContainer")[0].scrollHeight);
  @ViewChild('logContainer') private logScrollContainer: ElementRef;

  mode = 'Observable';
  private clientRequestEndpoint = 'client-request';

  logOutputLines: LogLine[];

  selectedTab: number;
  selectedNodes = [true, false, false, false, false];

  playgroundActive: boolean;
  serverUptime: string;
  serverVisits: number;
  userN: number;
  users: string[];
  memberStatuses: MemberStatus[];

  connect: Connect;
  connectErrorMessage: string;

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

  connected: boolean;
  showUser: boolean;

  constructor(private backendService: BackendService, private http: Http) {
    this.logOutputLines = [];

    this.selectedTab = 0;

    this.connect = backendService.connect;
    this.connectErrorMessage = '';

    this.serverStatusErrorMessage = '';

    this.playgroundActive = backendService.serverStatus.PlaygroundActive;
    this.serverUptime = backendService.serverStatus.ServerUptime;
    this.serverVisits = backendService.serverStatus.ServerVisits;
    this.userN = backendService.serverStatus.UserN;
    this.users = backendService.serverStatus.Users;
    this.memberStatuses = backendService.serverStatus.MemberStatuses;

    this.inputKey = '';
    this.inputValue = '';
    this.deleteReadByPrefix = false;
  }

  ngOnInit(): void {
    this.playgroundActive = false;
    this.scrollToBottom();
  }

  ngAfterContentInit() {
    console.log('getting initial server status');
    this.clickConnect();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // user leaves the template
  ngOnDestroy() {
    console.log('Disconnected from cluster (user left the page)!');
    this.closeConnect();
    clearInterval(this.serverStatusHandler);
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
      eps.push(this.memberStatuses[idxs[_i]].Endpoint);
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

  closeConnect() {
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

    this.sendLogLine('OK', 'Hello World!');
    this.sendLogLine('INFO', 'This is an actual etcd cluster.');
    this.sendLogLine('WARN', 'IPs and user agents are used only to prevent abuse.');

    this.startConnect();

    let host = window.location.hostname;
    let port = ':' + String(this.connect.WebPort);
    let backendURL = host + port;
    this.sendLogLine('INFO', 'Connected to backend ' + backendURL);

    this.connected = true;

    // (X) setInterval(this.getServerStatus, 1000);
    this.serverStatusHandler = setInterval(() => this.getServerStatus(), 1000);
  }

  clickDisconnect() {
    if (!this.playgroundActive) {
      this.sendLogLine('WARN', 'Already disconnected!');
      return;
    }
    this.playgroundActive = false;
    this.sendLogLine('WARN', 'Disconnected from etcd cluster!');

    this.connected = false;

    this.closeConnect();
    clearInterval(this.serverStatusHandler);
  }
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////
  processServerStatusResponse(resp: ServerStatus) {
    this.serverStatusErrorMessage = '';

    this.playgroundActive = resp.PlaygroundActive;
    this.serverUptime = resp.ServerUptime;
    this.serverVisits = resp.ServerVisits;
    this.userN = resp.UserN;
    this.users = resp.Users;
    this.memberStatuses = resp.MemberStatuses;

    if (!this.playgroundActive) {
      this.closeConnect();
      clearInterval(this.serverStatusHandler);
    };
  };

  // getServerStatus fetches server status from backend.
  // memberStatus is true to get the status of all nodes.
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
    if (!this.playgroundActive) {
      this.sendLogLine('WARN', 'Not connected to cluster! (Please click "Connect" button.)');
      return;
    }

    let eps = this.getSelectedNodeEndpoints();
    let prefix = this.deleteReadByPrefix;
    let key = this.inputKey;
    let val = this.inputValue;

    let nodeIndex = this.selectedTab - 3;
    if (act === 'stop-node' || act === 'restart-node') {
      eps = [this.memberStatuses[nodeIndex].Endpoint];
      prefix = false;
      key = '';
      val = '';
      this.sendLogLine('OK', 'requested "' + act + '" ' + this.memberStatuses[nodeIndex].Name);
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

  clickShowUser() {
    this.showUser = !this.showUser;
  }
}
