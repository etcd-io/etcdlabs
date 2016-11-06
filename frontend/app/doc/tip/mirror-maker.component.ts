import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';

@Component({
    selector: 'app-mirror-maker',
    templateUrl: 'mirror-maker.component.html',
    styleUrls: ['common/common.component.css'],
})
export class MirrorMakerTipComponent extends ParentComponent {
    docVersion: string;
    constructor() {
        super();
        this.docVersion = super.getDocVersion();
    }
}
