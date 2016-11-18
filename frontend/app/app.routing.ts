import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { InstallComponent } from './install/install.component';
import { TestsComponent } from './tests/tests.component';
import { PlayComponent } from './play/play.component';
import { NotFoundComponent } from './not-found.component';

// TODO
// import { ComparisonComponent } from './comparison/comparison.component';
// import { FAQComponent } from './faq/faq.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/play', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'install', component: InstallComponent },
    { path: 'tests', component: TestsComponent },
    { path: 'play', component: PlayComponent },

    // { path: 'comparison', component: ComparisonComponent },
    // { path: 'faq', component: FAQComponent },

    { path: '**', component: NotFoundComponent },
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    HomeComponent,
    InstallComponent,
    PlayComponent,
    TestsComponent,

    // ComparisonComponent,
    // FAQComponent,

    NotFoundComponent,
];
