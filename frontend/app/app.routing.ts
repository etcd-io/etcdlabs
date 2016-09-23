import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main.component';
import { PlayComponent } from './play/play.component';

import { DocV31Component } from './doc/v3.1/doc.component';
import { InstallV31Component } from './doc/v3.1/install.component';
import { DeployV31Component } from './doc/v3.1/deploy.component';
import { EtcdctlV31Component } from './doc/v3.1/etcdctl.component';
import { FAQV31Component } from './doc/v3.1/faq.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/main', pathMatch: 'full' },
    { path: 'main', component: MainComponent },

    { path: 'playground', redirectTo: '/play', pathMatch: 'full' },
    { path: 'play', component: PlayComponent },

    // TODO: dot routing with '/doc/v3.1'
    { path: 'doc', redirectTo: '/doc/v31', pathMatch: 'full' },
    {
        path: 'doc/v31',
        children: [
            { path: '', component: DocV31Component },
            { path: 'install', component: InstallV31Component },
            { path: 'deploy', component: DeployV31Component },
            { path: 'etcdctl', component: EtcdctlV31Component },
            { path: 'faq', component: FAQV31Component }
        ]
    }
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    MainComponent,

    PlayComponent,

    DocV31Component,
    InstallV31Component,
    DeployV31Component,
    EtcdctlV31Component,
    FAQV31Component
];
