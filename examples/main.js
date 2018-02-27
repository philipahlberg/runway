import Router from './index.js';
import A from './component-a.js';
import C from './component-c.js';

export default new Router([
  {
    path: '/admin',
    component: A
  },
  {
    path: '/',
    component: A,
    children: [
      {
        path: 'param',
        redirect: '123'
      },
      {
        path: ':param',
        component: () => import('./component-b.js'),
        slot: 'router-view',
        children: [
          {
            path: '',
            component: C
          }
        ]
      },
      {
        path: '',
        component: C,
        slot: 'router-view'
      }
    ]
  }
], document.body);