import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';

// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  MatButtonModule,
  MatToolbarModule,
  MatCardModule,
  MatMenuModule,
  MatInputModule,
  MatTabsModule,
  MatCheckboxModule,
} from '@angular/material';

import { AppComponent } from './app.component';
import { routing, routedComponents } from './app.routing';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,

    HttpModule,
    JsonpModule,

    // BrowserAnimationsModule,
    NoopAnimationsModule,

    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
    MatTabsModule,
    MatCheckboxModule,

    routing,
  ],
  declarations: [
    AppComponent,
    routedComponents,
  ],
  entryComponents: [AppComponent],
})

export class AppModule {
  constructor(private _appRef: ApplicationRef) { }

  ngDoBootstrap() {
    this._appRef.bootstrap(AppComponent);
  }
}
