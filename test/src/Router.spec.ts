import { Router } from '../../src/Router';
import { StaticComponent } from './StaticComponent.js';

declare const expect: any;

const div = () => document.createElement('div');

// const createSpy = () => new Proxy({
//   calls: [],
// }, {
//   apply(target: any, self: any, args: any[]) {
//     target.calls.push({
//       arguments: args,
//     });
//   }
// });

describe('Router', () => {
  it('does not render before `connect` has been called', () => {
    const router = new Router([
      {
        path: '/',
        component: StaticComponent,
      }
    ]);
    expect(router.isConnected).to.equal(false);
  });

  it('connects the router to the DOM', async () => {
    const router = new Router([
      {
        path: '/',
        component: StaticComponent,
      }
    ]);

    const outlet = div();
    await router.connect(outlet);
    const children = Array.from(outlet.children);
    expect(children.length).to.equal(1);
    expect(router.isConnected).to.equal(true);
  });

  it('removes the previously rendered views', async () => {
    const router = new Router([
      {
        path: '/',
        component: StaticComponent,
      }
    ]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/');
    expect(outlet.firstChild).to.exist;
    router.disconnect();
    expect(outlet.firstChild).to.be.null;
  });

  it('renders a component', async () => {
    const router = new Router([
      {
        path: '/',
        component: StaticComponent,
      }
    ]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/');

    expect(outlet.firstChild).to.be.instanceof(StaticComponent);
  });

  it('resolves properties function as props', async () => {
    const router = new Router([{
      path: '/',
      component: StaticComponent,
      properties: () => ({ foo: 'bar' }),
    }]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/');

    const component = outlet.firstChild as StaticComponent;
    expect(component.foo).to.equal('bar');
  });

  it('passes a route snapshot to the properties function', async () => {
    let snapshot: any;
    
    const router = new Router([{
      path: '/:foo',
      component: StaticComponent,
      properties: ss => (snapshot = ss, {}),
    }]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/bar?foo=bar#hash');

    const { parameters, query, matched, hash } = snapshot!;

    expect(parameters.get('foo')).to.equal('bar');
    expect(query.get('foo')).to.equal('bar');
    expect(matched).to.be.a('string');
    expect(matched).to.equal('/bar');
    expect(hash).to.be.a('string');
    expect(hash).to.equal('hash');
  });

  it('nests components from nested routes', async () => {
    const router = new Router([{
      path: '/',
      component: StaticComponent,
      children: [{
        path: ':param',
        component: StaticComponent,
      }],
    }]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/123');

    const outer = outlet.firstChild;
    const inner = outer?.firstChild;

    expect(outer).to.be.instanceof(StaticComponent);
    expect(inner).to.be.instanceof(StaticComponent);
  });

  it('respects route guards', async () => {
    const router = new Router([
      {
        path: '/',
        component: StaticComponent,
        guard: () => false,
      }
    ]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/');

    const children = Array.from(outlet.children);
    expect(children.length).to.equal(0);
  });

  it('follows redirects', async () => {
    const router = new Router([
      {
        path: '/a',
        redirect: '/b',
      },
      {
        path: '/b',
        component: StaticComponent,
      },
    ]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/a');

    expect(location.pathname).to.equal('/b');
  });

  it('ignores query and hash', async () => {
    const router = new Router([
      {
        path: '/a',
        component: StaticComponent,
      },
    ]);

    const outlet = div();
    await router.connect(outlet);
    await router.push('/a?q=123#hash');

    expect(outlet.firstChild).to.exist;
    expect(location.pathname).to.equal('/a');
    expect(location.search).to.equal('?q=123');
    expect(location.hash).to.equal('#hash');
  });
});
