import { Component } from '@angular/core';

export class blogItem {
    title: string;
    url: string;
    constructor(title: string, url: string) {
        this.title = title;
        this.url = url;
    }
}

export class sidebarItem {
    year: number;
    id: string;
    blogItems: blogItem[];
    constructor(year: number, id: string, blogItems: blogItem[]) {
        this.year = year;
        this.id = id;
        this.blogItems = blogItems;
    }
}

@Component({
    selector: 'blog',
    templateUrl: 'blog.component.html',
    styleUrls: ['blog.component.css'],
})
export class BlogComponent {
    sidebarItems: sidebarItem[];
    constructor() {
        this.sidebarItems = [
            new sidebarItem(
                2016,
                'menu2016',
                [
                    // TODO: dot routing
                    new blogItem(
                        'Announcing etcd v3.1',
                        '/blog/2016/v31'
                    ),
                    new blogItem(
                        'Serializability and Distributed Software Transactional Memory with etcd3',
                        '/blog/2016/stm'
                    ),
                ]
            ),
        ];
    }

    getAllSidebarItems() {
        return this.sidebarItems;
    }
}
