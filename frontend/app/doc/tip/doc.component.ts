import { Component } from '@angular/core';
import { ParentComponent, SidebarItem } from './common.component';

@Component({
    selector: 'app-doc',
    templateUrl: 'doc.component.html',
    styleUrls: ['common.component.css'],
})
export class DocTipComponent extends ParentComponent {
    docItems: SidebarItem[];
    constructor() {
        super();
        this.docItems = super.getAllSidebarItems();
    }
}
