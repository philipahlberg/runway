import Router from 'lib';
import Dashboard from './dashboard.js';
import Docs from './docs.js';

const router = new Router([
  {
    path: '/',
    component: Dashboard
  },
  {
    path: '/docs',
    component: Docs
  }
]);

router.connect(document.body);

export default router;