import { Routes, RouterModule } from '@angular/router';

/*
/home
*/
import { HomeComponent } from './home/home.component';

/*
/doc
*/
import { doc_tip_Component } from './doc/tip/doc.component';
import { why_tip_Component } from './doc/tip/why.component';
import { install_deploy_tip_Component } from './doc/tip/install-deploy.component';
import { kubernetes_controller_tip_Component } from './doc/tip/kubernetes-controller.component';
import { tutorials_tip_Component } from './doc/tip/tutorials.component';
import { faq_tip_Component } from './doc/tip/faq.component';
import { performance_tip_Component } from './doc/tip/performance.component';
import { reliability_tip_Component } from './doc/tip/reliability.component';
import { versions_tip_Component } from './doc/tip/versions.component';

/*
/blog
*/
import { BlogComponent } from './blog/blog.component';
import { AnnouncingEtcdV31Component } from './blog/2016/announcing-etcd-v3.1.component';
import { AnnouncingEtcdWebsiteComponent } from './blog/2016/announcing-etcd-website.component';
import { STMComponent } from './blog/2016/stm.component';

/*
/play
*/
import { PlayComponent } from './play/play.component';

/*
/**
*/
import { NotFoundComponent } from './not-found.component';

const appRoutes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'main', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },

    { path: 'docs', redirectTo: '/doc', pathMatch: 'full' },
    { path: 'doc', redirectTo: '/doc/tip', pathMatch: 'full' },
    {
        path: 'doc/tip',
        children: [
            { path: '', component: doc_tip_Component },
            { path: 'why', component: why_tip_Component },
            { path: 'install-deploy', component: install_deploy_tip_Component },
            { path: 'kubernetes-controller', component: kubernetes_controller_tip_Component },
            { path: 'tutorials', component: tutorials_tip_Component },
            { path: 'faq', component: faq_tip_Component },
            { path: 'performance', component: performance_tip_Component },
            { path: 'reliability', component: reliability_tip_Component },
            { path: 'versions', component: versions_tip_Component },
        ],
    },

    { path: 'blogs', redirectTo: '/blog', pathMatch: 'full' },
    { path: 'blog', component: AnnouncingEtcdV31Component }, // update whenever we have a new post
    {
        path: 'blog',
        children: [
            {
                path: '2016',
                children: [
                    { path: 'announcing-etcd-v31', component: AnnouncingEtcdV31Component },
                    { path: 'announcing-etcd-website', component: AnnouncingEtcdWebsiteComponent },
                    { path: 'etcd-stm', component: STMComponent },
                ],
            }
        ],
    },

    // TODO: dot routing https://github.com/angular/angular/issues/11842
    { path: 'doc/v31', redirectTo: '/doc/tip', pathMatch: 'full' },
    { path: 'doc/v32', redirectTo: '/doc/tip', pathMatch: 'full' },

    // TODO
    { path: 'playground', redirectTo: '/play', pathMatch: 'full' },
    { path: 'play', component: PlayComponent },

    // { path: '**', redirectTo: '/home' },
    { path: '**', component: NotFoundComponent },
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [
    HomeComponent,

    doc_tip_Component,
    why_tip_Component,
    install_deploy_tip_Component,
    kubernetes_controller_tip_Component,
    tutorials_tip_Component,
    faq_tip_Component,
    performance_tip_Component,
    reliability_tip_Component,
    versions_tip_Component,

    BlogComponent,
    AnnouncingEtcdV31Component,
    AnnouncingEtcdWebsiteComponent,
    STMComponent,

    PlayComponent,

    NotFoundComponent,
];
