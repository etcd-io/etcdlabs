import { Component } from '@angular/core';
import { parentComponent, sidebarItem } from './common.component';

@Component({
    selector: 'app-doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css'],
})
export class DocTipComponent extends parentComponent {
    docItems: sidebarItem[];
    constructor() {
        super();
        this.docItems = super.getAllSidebarItems();
    }
}
