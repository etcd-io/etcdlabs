import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-vs',
    templateUrl: 'vs.component.html',
    styleUrls: ['common.component.css'],
})
export class VSTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
