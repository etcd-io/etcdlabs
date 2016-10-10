import { Component } from '@angular/core';
import { parentComponent } from './common.component';

@Component({
    selector: 'app-tutorials',
    templateUrl: 'tutorials.component.html',
    styleUrls: ['common.component.css'],
})
export class TutorialsTipComponent extends parentComponent {
    constructor() {
        super();
    }
}
