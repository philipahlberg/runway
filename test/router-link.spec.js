import { Router } from '../src/router';
import { RouterLink } from '../src/router-link';

RouterLink.install();

const a = (href) => {
  const el = document.createElement('a');
  el.href = href;
  return el;
};

const div = () => document.createElement('div');

const connect = (el) => el.connectedCallback();
const disconnect = (el) => el.disconnectedCallback();
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

  it('applies active attribute when it matches', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    expect(link.to).to.equal('/abc');
    expect(link.active).to.be.false;

    await router.push('/abc');

    expect(link.active).to.be.true;
  });

  // Does a full page reload for some reason.
  // Skipped until the cause has been found.
  it.skip('intercepts clicks', async () => {
    const link = new RouterLink();
    const anchor = a('/abc');
    link.appendChild(a('/abc'));
    connect(link);

    anchor.click();
    await Promise.resolve();

    expect(link.active).to.be.true;
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