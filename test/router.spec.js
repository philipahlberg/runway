import Router from 'lib';
import {
  SimpleComponent,
  ParamComponent,
  AsyncComponent
} from './components.js';

const div = () => document.createElement('div');

describe('Router', () => {
  describe('constructor', () => {
    it('converts records to routes', () => {
      const router = new Router([
        { path: '/a' }
      ]);
      expect(router.routes).to.be.instanceof(Array);
    });

    it('renders if a DOM target is given');
    // it('renders if a DOM target is given', async () => {
    //   const outlet = div();
    //   const router = new Router([
    //     { path: '/', component: SimpleComponent }
    //   ], outlet);

    //   expect(router.routes).to.have.lengthOf(1);

    //   await Promise.resolve();
    //   await Promise.resolve();

    //   expect(router.elements).to.have.lengthOf(1);
    // });

    it('does not render if a DOM target is not given', () => {
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
      expect(matched).to.be.an('array').that.has.lengthOf(1);

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
