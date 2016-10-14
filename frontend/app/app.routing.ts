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
import { TutorialsTipComponent } from './doc/tip/tutorials.component';
import { TutorialsAdvancedTipComponent } from './doc/tip/tutorials-advanced.component';
import { FAQTipComponent } from './doc/tip/faq.component';
import { PerformanceTipComponent } from './doc/tip/performance.component';
import { ReliabilityTipComponent } from './doc/tip/reliability.component';
import { ComparisonTipComponent } from './doc/tip/comparison.component';
import { VersionsTipComponent } from './doc/tip/versions.component';

/*
blog
*/
import { BlogComponent } from './blog/blog.component';
import { AnnouncingEtcdV31Component } from './blog/2016/v3.1.component';
import { STMComponent } from './blog/2016/stm.component';

/*
play
*/
import { PlayComponent } from './play/play.component';

/*
**
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
            { path: '', component: DocTipComponent },
            { path: 'install-deploy', component: InstallDeployTipComponent },
            { path: 'tutorials', component: TutorialsTipComponent },
            { path: 'tutorials-advanced', component: TutorialsAdvancedTipComponent },
            { path: 'faq', component: FAQTipComponent },
            { path: 'performance', component: PerformanceTipComponent },
            { path: 'reliability', component: ReliabilityTipComponent },
            { path: 'comparison', component: ComparisonTipComponent },
            { path: 'versions', component: VersionsTipComponent },
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
                    { path: 'v31', component: AnnouncingEtcdV31Component },
                    { path: 'stm', component: STMComponent },
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

    DocTipComponent,
    InstallDeployTipComponent,
    TutorialsTipComponent,
    TutorialsAdvancedTipComponent,
    FAQTipComponent,
    PerformanceTipComponent,
    ReliabilityTipComponent,
    ComparisonTipComponent,
    VersionsTipComponent,

    BlogComponent,
    AnnouncingEtcdV31Component,
    STMComponent,

    PlayComponent,

    NotFoundComponent,
];
