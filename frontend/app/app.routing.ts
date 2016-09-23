import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main.component';
import { PlayComponent } from './play/play.component';

import { DocTipComponent } from './doc/tip/doc.component';
import { InstallDeployTipComponent } from './doc/tip/install-deploy.component';
import { KubernetesTipComponent } from './doc/tip/kubernetes.component';
import { EtcdctlTipComponent } from './doc/tip/etcdctl.component';
import { FAQTipComponent } from './doc/tip/faq.component';
import { PerformanceTipComponent } from './doc/tip/performance.component';
import { ReliabilityTipComponent } from './doc/tip/reliability.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/main', pathMatch: 'full' },
    { path: 'main', component: MainComponent },

    { path: 'playground', redirectTo: '/play', pathMatch: 'full' },
    { path: 'play', component: PlayComponent },

    // TODO: dot routing with '/doc/v3.1'
    // https://github.com/angular/angular/issues/11842
    { path: 'doc', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'docs', redirectTo: '/doc', pathMatch: 'full' },
    {
        path: 'doc/tip',
        children: [
            { path: '', component: DocTipComponent },
            { path: 'install-deploy', component: InstallDeployTipComponent },
            { path: 'kubernetes', component: KubernetesTipComponent },
            { path: 'etcdctl', component: EtcdctlTipComponent },
            { path: 'faq', component: FAQTipComponent },
            { path: 'performance', component: PerformanceTipComponent },
            { path: 'reliability', component: ReliabilityTipComponent }
        ]
    },

    // TODO: create versioned docs after release
    { path: 'doc/v31', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'doc/v32', redirectTo: '/doc/tip', pathMatch: 'full' }
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    MainComponent,

    PlayComponent,

    DocTipComponent,
    InstallDeployTipComponent,
    KubernetesTipComponent,
    EtcdctlTipComponent,
    FAQTipComponent,
    PerformanceTipComponent,
    ReliabilityTipComponent
];
