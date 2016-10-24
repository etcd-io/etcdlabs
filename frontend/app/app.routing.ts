import { Routes, RouterModule } from '@angular/router';

/*
home
*/
import { HomeComponent } from './home/home.component';

/*
doc
*/
import { DocTipComponent } from './doc/tip/doc.component';
import { InstallDeployTipComponent } from './doc/tip/install-deploy.component';
import { KubernetesTipComponent } from './doc/tip/kubernetes.component';
import { QuickTutorialsTipComponent } from './doc/tip/quick-tutorials.component';
import { FAQTipComponent } from './doc/tip/faq.component';
import { ComparisonTipComponent } from './doc/tip/comparison.component';
import { STMTipComponent } from './doc/tip/stm.component';
import { VersionsTipComponent } from './doc/tip/versions.component';

/*
play
*/
import { PlayComponent } from './play/play.component';

/*
**
*/
import { NotFoundComponent } from './not-found.component';

const appRoutes: Routes = [
    // etcd main page
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'main', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },

    // etcd documentation
    { path: 'docs', redirectTo: '/doc', pathMatch: 'full' },
    { path: 'doc', redirectTo: '/doc/tip', pathMatch: 'full' },
    {
        path: 'doc/tip',
        children: [
            { path: '', component: DocTipComponent },
            { path: 'install-deploy', component: InstallDeployTipComponent },
            { path: 'kubernetes', component: KubernetesTipComponent },
            { path: 'quick-tutorials', component: QuickTutorialsTipComponent },
            { path: 'faq', component: FAQTipComponent },
            { path: 'comparison', component: ComparisonTipComponent },
            { path: 'stm', component: STMTipComponent },
            { path: 'versions', component: VersionsTipComponent },
        ],
    },

    // TODO: dot routing https://github.com/angular/angular/issues/11842
    { path: 'doc/v31', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'doc/v32', redirectTo: '/doc/tip', pathMatch: 'full' },

    // etcd playground
    { path: 'playground', redirectTo: '/play', pathMatch: 'full' },
    { path: 'play', component: PlayComponent },

    // { path: '**', redirectTo: '/home' },
    { path: '**', component: NotFoundComponent },
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    HomeComponent,

    DocTipComponent,
    InstallDeployTipComponent,
    KubernetesTipComponent,
    QuickTutorialsTipComponent,
    FAQTipComponent,
    ComparisonTipComponent,
    STMTipComponent,
    VersionsTipComponent,

    PlayComponent,

    NotFoundComponent,
];
