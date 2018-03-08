import Router from 'lib';
import Dashboard from './dashboard.js';

const router = new Router([
  {
    path: '/',
    component: Dashboard
  },
  {
    path: '/docs',
    component: () => import('.(docs.js')
  }
]);

router.connect(document.body);

export default router;