import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { InstallComponent } from './install/install.component';
import { PlayComponent } from './play/play.component';
import { NotFoundComponent } from './not-found.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/play', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'install', component: InstallComponent },
    { path: 'play', component: PlayComponent },
    { path: '**', component: NotFoundComponent },
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    HomeComponent,
    InstallComponent,
    PlayComponent,
    NotFoundComponent,
];
