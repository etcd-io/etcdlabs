import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css']
})
export class doc_tip_Component extends parentComponent {
    constructor() {
        super();
    }
}
