import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BlogComponent } from './blog/blog.component';
import { PlayComponent } from './play/play.component';

// '/doc' page
import { doc_tip_Component } from './doc/tip/doc.component';
import { install_deploy_tip_Component } from './doc/tip/install-deploy.component';
import { kubernetes_tip_Component } from './doc/tip/kubernetes.component';
import { etcdctl_tip_Component } from './doc/tip/etcdctl.component';
import { faq_tip_Component } from './doc/tip/faq.component';
import { performance_tip_Component } from './doc/tip/performance.component';
import { reliability_tip_Component } from './doc/tip/reliability.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'main', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },

    { path: 'blogs', redirectTo: '/blog', pathMatch: 'full' },
    { path: 'blog', component: BlogComponent },

    { path: 'playground', redirectTo: '/play', pathMatch: 'full' },
    { path: 'play', component: PlayComponent },

    // TODO: dot routing with '/doc/v3.1'
    // https://github.com/angular/angular/issues/11842
    { path: 'doc', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'docs', redirectTo: '/doc', pathMatch: 'full' },
    {
        path: 'doc/tip',
        children: [
            { path: '', component: doc_tip_Component },
            { path: 'install-deploy', component: install_deploy_tip_Component },
            { path: 'kubernetes', component: kubernetes_tip_Component },
            { path: 'etcdctl', component: etcdctl_tip_Component },
            { path: 'faq', component: faq_tip_Component },
            { path: 'performance', component: performance_tip_Component },
            { path: 'reliability', component: reliability_tip_Component }
        ]
    },

    // TODO: create versioned docs after release
    // TODO: dot routing
    { path: 'doc/v31', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'doc/v32', redirectTo: '/doc/tip', pathMatch: 'full' }
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    HomeComponent,
    PlayComponent,
    BlogComponent,

    doc_tip_Component,
    install_deploy_tip_Component,
    kubernetes_tip_Component,
    etcdctl_tip_Component,
    faq_tip_Component,
    performance_tip_Component,
    reliability_tip_Component
];
