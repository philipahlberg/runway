import { Router, RouterLink } from '/index.js';
import SignIn from '/views/sign-in.js';
import Admin from '/views/admin.js';
import Dashboard from '/views/dashboard.js';
import NewProduct from '/views/new-product.js';
import Products from '/views/products.js';
import Product from '/views/product.js';
import api from '/api.js';

// Load function for a lazy-loaded component
const SignUp = () => import('./views/sign-up.js').then(mod => mod.default);

let user;
api.addEventListener('sign-in', () => {
  user = api.user;
});

const router = new Router({
  root: '/',
  routes: [
    // Direct match:
    // When `/sign-in` is navigated to,
    // this will be matched and SignIn
    // will be rendered.
    {
      path: 'sign-in',
      component: SignIn
    },
    // Redirect:
    // When `/` is navigated to,
    // the navigation will be redirected
    // to `/dashboard`.
    {
      path: '',
      redirect: 'dashboard'
    },
    {
      path: 'dashboard',
      component: Dashboard
    },
    // Nested configuration:
    // When `/products` is navigated to,
    // Products will be rendered.
    // Then, the routes in `children`
    // will be checked.
    {
      path: 'products',
      component: Products,
      children: [
        {
          path: 'new',
          component: NewProduct
        },
        // A named parameter
        // Use `properties` to pass the value to the
        // component instance.
        {
          path: ':product_id',
          component: Product,
          properties: ({ parameters }) => ({
            productId: parameters.get('product_id')
          })
        }
      ]
    },
    // Guarded routes:
    // A guarded route will not match if `guard()` returns false
    {
      path: 'admin',
      guard: () => user && user.admin && user.signedIn,
      component: Admin
    },
    // Conditional redirect:
    // Redirects to /dashboard if the user is not an admin
    {
      path: 'admin',
      guard: () => !user || !user.signedIn || !user.admin,
      redirect: '/dashboard'
    },
    // Lazy-loaded component
    {
      path: 'sign-up',
      load: SignUp,
    }
  ]
});

// Setup the <router-link> element
RouterLink.use(router);
customElements.define('router-link', RouterLink);

// Connect the router to the document
router.connect(document.body);

export default router;