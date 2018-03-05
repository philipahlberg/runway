import Router from './index.min.js';
import Login from './login.js';
import Dashboard from './dashboard.js';
import Users from './users.js';
import User from './user.js';
import { loggedIn } from './auth.js';

const router = new Router([
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/dashboard',
    component: Dashboard
  },
  {
    path: '/admin',
    component: () => import('./admin.js'),
    guard: () => loggedIn
  },
  {
    path: '/users',
    component: Users,
    children: [
      {
        path: ':user_id',
        component: User
      }
    ]
  }
]);

router.connect(document.body);

export default router;