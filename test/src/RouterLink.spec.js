import { Router } from '../../src/Router.ts';
import { RouterLink } from '../../src/RouterLink.ts';

const a = (href) => {
  const el = document.createElement('a');
  el.href = href;
  return el;
};

const div = () => document.createElement('div');
const connect = (el) => document.body.appendChild(el);

describe('RouterLink', async () => {
  const router = new Router([]);
  await router.connect(div());

  beforeEach(async () => {
    await router.push('/');
  });

  after(() => {
    router.disconnect();
  });

  it('can be installed', () => {
    RouterLink.install({
      router
    });

    const routerLink = new RouterLink();
    expect(routerLink).to.be.instanceOf(HTMLElement);
  });

  it('applies active attribute when it matches', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    expect(link.to).to.equal('/abc');
    expect(link.active).to.equal(false);

    await router.push('/abc');

    expect(link.active).to.equal(true);
  });

  it('clicking the link triggers navigation', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    link.click();
    await Promise.resolve();

    expect(location.pathname).to.equal('/abc');
    expect(link.active).to.equal(true);
  });

  it('disabling the link prevents navigation', async () => {
    const pathname = location.pathname;

    const link = new RouterLink();
    link.disabled = true;
    link.appendChild(a('/abc'));
    connect(link);

    link.click();
    await Promise.resolve();

    expect(location.pathname).to.equal(pathname);
    expect(pathname).to.not.equal('/abc');
  });

  it('intercepts clicks on child anchor', async () => {
    const link = new RouterLink();
    const anchor = a('/abc');
    link.appendChild(anchor);
    connect(link);

    anchor.click();
    await Promise.resolve();

    expect(link.active).to.equal(true);
  });

  it('can be configured to match exactly', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    link.to = '/abc';
    link.exact = true;
    connect(link);

    await router.push('/abc');
    expect(link.active).to.equal(true);

    await router.push('/abcd');
    expect(link.active).to.equal(false);
  });
});
