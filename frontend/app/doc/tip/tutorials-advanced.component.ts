import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-tutorials-advanced',
    templateUrl: 'tutorials-advanced.component.html',
    styleUrls: ['common.component.css'],
})
export class TutorialsAdvancedTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
