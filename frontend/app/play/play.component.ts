import { Component } from '@angular/core';

@Component({
  selector: 'play',
  templateUrl: 'play.component.html',
  styleUrls: ['play.component.css'],
})
export class PlayComponent {
  selectedTab: number;
  constructor() {
    this.selectedTab = 2;
  }
  selectTab(num: number) {
    this.selectedTab = num;
  }
}
