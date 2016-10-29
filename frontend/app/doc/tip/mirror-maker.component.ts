import { Component } from '@angular/core';
import { ParentComponent } from './common.component';

@Component({
    selector: 'app-mirror-maker',
    templateUrl: 'mirror-maker.component.html',
    styleUrls: ['common.component.css'],
})
export class MirrorMakerTipComponent extends ParentComponent {
    constructor() {
        super();
    }
}
