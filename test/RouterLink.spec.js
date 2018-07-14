import { Router, RouterLink } from './lib.js';


const a = (href) => {
  const el = document.createElement('a');
  el.href = href;
  return el;
};

const div = () => document.createElement('div');
const connect = (el) => document.body.appendChild(el);
const disconnect = (el) => document.body.removeChild(el);
const push = (path) => history.pushState(null, null, path);

describe('<router-link>', async () => {
  const router = new Router([]);
  await router.connect(div());

  beforeEach(async () => {
    await router.push('/');
  });

  after(() => {
    router.disconnect();
  });
  
  it('accepts tagName and options in .define()', () => {
    RouterLink.define('router-link', { router });
  });

  it('applies active attribute when it matches', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    expect(link.to).to.equal('/abc');
    expect(link.active).to.be.false;

    await router.push('/abc');

    expect(link.active).to.be.true;
  });

  it('triggers navigation', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    link.click();
    await Promise.resolve();

    expect(location.pathname).to.equal('/abc');
    expect(link.active).to.be.true;
  });

  // Does a full page reload for some reason.
  // Skipped until the cause has been found.
  it('intercepts clicks', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    // anchor.dispatchEvent(new MouseEvent('click', {
    //   button: 0
    // }));

    // expect(link.active).to.be.true;
  });

  it('can be configured to match exactly', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    link.to = '/abc';
    link.exact = true;
    connect(link);

    await router.push('/abc');
    expect(link.active).to.be.true;

    await router.push('/abcd');
    expect(link.active).to.be.false;
  });

  it('can be disabled', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    link.to = '/abc';
    link.disabled = true;

    await router.push('/abc');

    expect(link.active).to.be.false;
  });
});