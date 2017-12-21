import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor(meta: Meta, title: Title) {
    title.setTitle('etcd Labs');

    meta.addTags([
      { name: 'author', content: 'etcd'},
      { name: 'keywords', content: 'etcd, etcd demo, etcd setting, etcd cluster, etcd install'},
      { name: 'description', content: 'This is etcd demo, install guides!' }
    ]);
  }

  ngOnInit(): void {
  }
}
