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
import { KubernetesEtcdOperatorTipComponent } from './doc/tip/kubernetes-etcd-operator.component';
import { KubernetesTipComponent } from './doc/tip/kubernetes.component';
import { QuickTutorialsTipComponent } from './doc/tip/quick-tutorials.component';
import { FAQTipComponent } from './doc/tip/faq.component';
import { ComparisonTipComponent } from './doc/tip/comparison.component';
import { STMTipComponent } from './doc/tip/stm.component';
import { TuningEtcdTipComponent } from './doc/tip/tuning-etcd.component';
import { MirrorMakerTipComponent } from './doc/tip/mirror-maker.component';
import { GRPCProxyTipComponent } from './doc/tip/grpc-proxy.component';
import { MaintenanceTipComponent } from './doc/tip/maintenance.component';
import { UpgradeEtcdTipComponent } from './doc/tip/upgrade-etcd.component';
import { RuntimeReconfigurationTipComponent } from './doc/tip/runtime-reconfiguration.component';
import { DisasterRecoveryTipComponent } from './doc/tip/disaster-recovery.component';

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
            { path: 'kubernetes-etcd-operator', component: KubernetesEtcdOperatorTipComponent },
            { path: 'kubernetes', component: KubernetesTipComponent },
            { path: 'quick-tutorials', component: QuickTutorialsTipComponent },
            { path: 'faq', component: FAQTipComponent },
            { path: 'comparison', component: ComparisonTipComponent },
            { path: 'stm', component: STMTipComponent },
            { path: 'tuning-etcd', component: TuningEtcdTipComponent },
            { path: 'mirror-maker', component: MirrorMakerTipComponent },
            { path: 'grpc-proxy', component: GRPCProxyTipComponent },
            { path: 'maintenance', component: MaintenanceTipComponent },
            { path: 'upgrade-etcd', component: UpgradeEtcdTipComponent },
            { path: 'runtime-reconfiguration', component: RuntimeReconfigurationTipComponent },
            { path: 'disaster-recovery', component: DisasterRecoveryTipComponent },
        ],
    },

    // versioned docs
    { path: 'doc/v3.1', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'doc/v3.2', redirectTo: '/doc/tip', pathMatch: 'full' },

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
    KubernetesEtcdOperatorTipComponent,
    KubernetesTipComponent,
    QuickTutorialsTipComponent,
    FAQTipComponent,
    ComparisonTipComponent,
    STMTipComponent,
    TuningEtcdTipComponent,
    MirrorMakerTipComponent,
    GRPCProxyTipComponent,
    MaintenanceTipComponent,
    UpgradeEtcdTipComponent,
    RuntimeReconfigurationTipComponent,
    DisasterRecoveryTipComponent,

    PlayComponent,

    NotFoundComponent,
];
