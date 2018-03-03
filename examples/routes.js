import Router from './index.min.js';
import Login from './login.js';
import Dashboard from './dashboard.js';
import Users from './users.js';
import User from './user.js';
import { loggedIn } from './auth.js';

export default new Router([
  {
    path: '/login',
    component: Login
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
  },
  {
    path: '/deprecated',
    redirect: '/login'
  },
  {
    path: '/',
    component: Dashboard
  }
], document.body);