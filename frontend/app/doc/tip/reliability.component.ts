import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-reliability',
    templateUrl: 'reliability.component.html',
    styleUrls: ['common.component.css'],
})
export class ReliabilityTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
