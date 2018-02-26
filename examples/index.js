import { Router } from './index.min.js';
import A from './component-a.js';
import C from './component-c.js';

export default new Router([
  {
    path: '/',
    component: A,
    children: [
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
], document.getElementById('root'));