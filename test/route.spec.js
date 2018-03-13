import { Route } from 'runway';
import {
  SimpleComponent,
  ParamComponent,
  AsyncComponent
} from './components.js';

describe('Route', () => {
  describe('.import', () => {
    it('resolves an ordinary component', async () => {
      const Component = await Route.import(SimpleComponent);
      expect(Component).to.equal(SimpleComponent);
    });

    it('resolves a string', async () => {
      const Component = await Route.import('simple-component');
      expect(Component).to.equal(SimpleComponent);
    });

    it('resolves an async component', async () => {
      const Component = await Route.import(AsyncComponent);
      expect(Component).to.equal(SimpleComponent);
    });
  });

  describe('#matches', () => {
    it('matches a simple route', () => {
      const route = new Route({ path: '/' });
      expect(route.matches('/')).to.be.true;
    });

    it('matches a route with a named parameter', () => {
      const route = new Route({ path: '/:a' });
      expect(route.matches('/1')).to.be.true;
    });

    it('supports nesting', () => {
      const route = new Route({
        path: '/a',
        children: [{ path: 'b' }]
      });
      const child = route.children[0];
      expect(child.matches('/a/b')).to.be.true;
    });
  });

  describe('#import', async () => {
    it('resolves an ordinary component', async () => {
      const route = new Route({ component: SimpleComponent });
      const Component = await route.import();
      expect(Component).to.equal(SimpleComponent);
    });

    it('resolves a string', async () => {
      const route = new Route({ component: 'simple-component' });
      const Component = await route.import();
      expect(Component).to.equal(SimpleComponent);
    });

    it('resolves an async component', async () => {
      const route = new Route({ component: AsyncComponent });
      const Component = await route.import();
      expect(Component).to.equal(SimpleComponent);
    });

    it.skip('resolves an imported component', async () => {
      const route = new Route({
        path: '/',
        component: () => import('./import.js')
      });

      const Component = await route.import();
      expect(Component).to.exist;
      expect(Component.prototype).to.equal(HTMLElement);
    });
  });

  describe('#snapshot', () => {
    it('provides key details of the route in relation to the given path', () => {
      const route = new Route({ path: '/:param' });
      const { parameters, query, hash, matched } = route.snapshot(
        '/123?q=456#hash'
      );

      expect(parameters.get('param')).to.equal('123');
      expect(query.get('q')).to.equal('456');
      expect(hash).to.equal('hash');
      expect(matched).to.equal('/123');
    });
  });
});
