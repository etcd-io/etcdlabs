import { Component } from '@angular/core';
import { ParentComponent } from './common/common.component';
import { TesterMetrics } from './common/etcd.component';

@Component({
    selector: 'app-comparison',
    templateUrl: 'comparison.component.html',
    styleUrls: ['common/common.component.css'],
})
export class ComparisonTipComponent extends ParentComponent {
    testerClusterLastUpdate: string;
    testerCluster3Node: TesterMetrics;
    testerCluster5Node: TesterMetrics;
    testerCluster3NodeFailpoints: TesterMetrics;
    testerCluster5NodeFailpoints: TesterMetrics;

    constructor() {
        super();

        this.testerClusterLastUpdate = '';
        this.testerCluster3Node = new TesterMetrics('3-node');
        this.testerCluster5Node = new TesterMetrics('5-node');
        this.testerCluster3NodeFailpoints = new TesterMetrics('3-node failpoints');
        this.testerCluster5NodeFailpoints = new TesterMetrics('5-node failpoints');
    }
}
