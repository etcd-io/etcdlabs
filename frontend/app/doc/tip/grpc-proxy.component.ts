import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-grpc-proxy',
    templateUrl: 'grpc-proxy.component.html',
    styleUrls: ['common.component.css'],
})
export class GRPCProxyTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
