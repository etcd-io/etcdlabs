import { Routes, RouterModule } from '@angular/router';
import { EtcdComponent } from './etcd.component';
import { DocComponent }  from './doc.component';
import { PlayComponent } from './play.component';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: '/etcd',
        pathMatch: 'full'
    },

    {
        path: 'etcd',
        component: EtcdComponent
    },
    {
        path: 'main',
        component: EtcdComponent
    },
    {
        path: 'home',
        component: EtcdComponent
    },

    {
        path: 'doc',
        component: DocComponent
    },
    {
        path: 'docs',
        component: DocComponent
    },
    {
        path: 'documentation',
        component: DocComponent
    },

    {
        path: 'play',
        component: PlayComponent
    },
    {
        path: 'playground',
        component: PlayComponent
    }
];

export const routing = RouterModule.forRoot(appRoutes);

export const routedComponents = [EtcdComponent, DocComponent, PlayComponent];
