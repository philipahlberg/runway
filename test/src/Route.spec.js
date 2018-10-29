import { Route } from '../../src/Route.ts';
import { StaticComponent } from './StaticComponent.js';

describe('Route', () => {
  describe('#matches', () => {
    it('matches a simple route', () => {
      const route = new Route({
        path: '/',
        component: StaticComponent
      });
      expect(route.matches('/')).to.be.true;
    });

    it('matches a route with a named parameter', () => {
      const route = new Route({ path: '/:a' });
      expect(route.matches('/1')).to.be.true;
    });

    it('supports nesting', () => {
      const route = new Route({
        path: '/a',
        component: StaticComponent,
        children: [{ path: 'b', component: StaticComponent }]
      });
      const child = route.children[0];
      expect(child.matches('/a/b')).to.equal(true);
    });
  });

  describe('#import', async () => {
    it('resolves a static component', async () => {
      const route = new Route({
        path: '/',
        component: StaticComponent
      });
      const Component = await route.import();
      expect(Component).to.equal(StaticComponent);
    });

    it('resolves a dynamic component', async () => {
      const route = new Route({
        path: '/',
        load: () => import('./DynamicComponent.js')
      });

      const Component = await route.import();
      const DynamicComponent = customElements.get('dynamic-component');
      expect(Component).to.equal(DynamicComponent);
    });
  });

  describe('#snapshot', () => {
    it('provides key details of the route in relation to the given path', () => {
      const route = new Route({ path: '/:param' });
      const { parameters, query, hash, matched } = route.snapshot(
        new URL('/123?q=456#hash', location.href)
      );

      expect(parameters.get('param')).to.equal('123');
      expect(query.get('q')).to.equal('456');
      expect(hash).to.equal('hash');
      expect(matched).to.equal('/123');
    });
  });

  describe('#transfer', () => {
    it('transfers parameters from one route to another', () => {
      const route = new Route({
        path: '/:a/:b/:c'
      });
      const source = '/1/2/3';
      const target = '/:a/:c/:b';
      const result = route.transfer(source, target);
      expect(result).to.equal('/1/3/2');
    });
  });
});
