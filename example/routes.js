import Router from '/index.min.js';

import SignIn from '/views/sign-in.js';
import Admin from '/views/admin.js';
import Dashboard from '/views/dashboard.js';
import Products from '/views/products.js';
import Product from '/views/product.js';

import { user } from '/auth.js';

const router = new Router([
  // A simple matcher
  {
    path: '/signin',
    component: SignIn
  },
  // A simple redirect
  {
    path: '/',
    redirect: '/dashboard'
  },
  // A nested configuration
  {
    path: '/products',
    component: Products,
    children: [
      // A named parameter that passes the corresponding value to the component
      {
        path: ':product_id',
        component: Product
      }
    ]
  },
  // `properties` will be resolved on the component
  {
    path: '/dashboard',
    component: Dashboard,
    properties: () => ({ user })
  },
  // A guarded route will not match if `guard()` returns false
  {
    path: '/admin',
    guard: () => user.admin && user.signedIn,
    component: Admin
  },
  // Conditional redirect:
  // Redirects to /dashboard if the user is not an admin
  {
    path: '/admin',
    guard: () => !(user.admin && user.signedIn),
    redirect: '/dashboard'
  },
  // Lazy-loaded component
  {
    path: '/signup',
    component: () => import('./views/sign-up.js')
  }
]);

router.connect(document.body);
export { router };