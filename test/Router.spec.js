import { Router } from './lib.js';

const SimpleComponent = customElements.get('simple-component');
const ParamComponent = customElements.get('param-component');
const AsyncComponent = () => Promise.resolve(SimpleComponent);

const div = () => document.createElement('div');

describe('Router', () => {
  describe('constructor', () => {
    it('converts records to routes', () => {
      const router = new Router([
        { path: '/a', component: SimpleComponent }
      ]);
      expect(router.routes).to.be.instanceof(Array);
    });

    it('does not render', () => {
      const router = new Router([
        { path: '/', component: SimpleComponent }
      ]);
      expect(router.elements).to.be.empty;
    });
  });

  describe('#connect', () => {
    it('connects the router to the DOM', async () => {
      const router = new Router([
        { path: '/', component: SimpleComponent }
      ]);

      const outlet = div();
      await router.connect(outlet);
      const children = Array.from(outlet.children);
      expect(children).to.deep.equal(router.elements);
    });
  });

  describe('#disconnect', () => {
    it('removes the previously rendered views', async () => {
      const router = new Router([
        { path: '/', component: SimpleComponent }
      ]);

      const outlet = div();
      await router.connect(outlet);
      await router.push('/');
      expect(outlet.firstChild).to.exist;
      router.disconnect();
      expect(outlet.firstChild).to.be.null;
      expect(router.elements).to.be.empty;
    });
  });

  describe('#match', () => {
    it('matches a simple route', () => {
      const router = new Router([
        { path: '/a' },
        { path: '/abc' }
      ]);

      const { matched, path } = router.match('/a');
      expect(path).to.equal('/a');
      expect(matched).to.be.an('array').that.has.length(1);

      const route = matched[0];
      expect(route).to.have.property('path', '/a');
    });

    it('ignores query', () => {
      const router = new Router([
        { path: '/a' },
        { path: '/abc' }
      ]);

      const { matched, path } = router.match('/a?q=123');
      expect(path).to.equal('/a?q=123');
      expect(matched).to.be.an('array').that.has.length(1);

      const route = matched[0];
      expect(route).to.have.property('path', '/a');
    });

    it('ignores hash', () => {
      const router = new Router([
        { path: '/a' }
      ]);

      const { matched, path } = router.match('/a#hash');
      expect(path).to.equal('/a#hash');
      expect(matched).to.be.an('array').that.has.length(1);

      const route = matched[0];
      expect(route).to.have.property('path', '/a');
    });

    it('ignores both query and hash', () => {
      const router = new Router([
        { path: '/a' }
      ]);

      const { matched, path } = router.match('/a?q=123#hash');
      expect(path).to.equal('/a?q=123#hash');
      expect(matched).to.be.an('array').that.has.length(1);

      const route = matched[0];
      expect(route).to.have.property('path', '/a');
    });

    it('follows redirects', () => {
      const router = new Router([
        { path: '/a', redirect: '/b' },
        { path: '/b' }
      ]);

      const { matched, path } = router.match('/a');
      expect(path).to.equal('/b');
      expect(matched).to.be.an('array').that.has.lengthOf(1);

      const route = matched[0];
      expect(route).to.have.property('path', '/b');
    });

    it('respects route guards', () => {
      const router = new Router([
        { path: '/', guard: () => false }
      ]);

      const { matched } = router.match('/');
      expect(matched).to.have.lengthOf(0);
    });

    it('matches nested routes', () => {
      const router = new Router([{
        path: '/',
        children: [
          { path: 'abc' }
        ]
      }]);

      const { matched } = router.match('/abc');
      expect(matched).to.have.lengthOf(2);
    })
  });

  describe('#render', () => {
    it('renders a component', async () => {
      const router = new Router([
        { path: '/', component: SimpleComponent }
      ]);
  
      const outlet = div();
      await router.connect(outlet);
      await router.push('/');
  
      expect(outlet.firstChild).to.be.instanceof(SimpleComponent);
    });

    it('resolves parameters as props', async () => {
      const router = new Router([
        { path: '/:param', component: ParamComponent }
      ]);
  
      const outlet = div();
      await router.connect(outlet);
      await router.push('/123');
  
      expect(outlet.firstChild.param).to.equal('123');
    });

    it('resolves properties function as props', async () => {
      const router = new Router([
        {
          path: '/',
          component: ParamComponent,
          properties: () => ({ param: '123' })
        }
      ]);

      const outlet = div();
      await router.connect(outlet);
      await router.push('/');

      expect(outlet.firstChild.param).to.equal('123');
    });

    it('passes a route snapshot to the properties function', async () => {
      const router = new Router([
        {
          path: '/',
          component: ParamComponent,
          properties: route => ({ param: route.query.get('q') })
        }
      ]);

      const outlet = div();
      await router.connect(outlet);
      await router.push('/?q=123');

      expect(outlet.firstChild.param).to.equal('123');
    });

    it('nests components from nested routes', async () => {
      const router = new Router([{
        path: '/',
        component: SimpleComponent,
        children: [{
          path: ':param',
          component: ParamComponent
        }]
      }]);

      const outlet = div();
      await router.connect(outlet);
      await router.push('/123');

      const outer = outlet.firstChild;
      const inner = outer.firstChild;

      expect(outer).to.be.instanceof(SimpleComponent);
      expect(inner).to.be.instanceof(ParamComponent);
    });
  });
});