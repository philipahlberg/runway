import Router, { RouterLink } from 'lib';

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

const nextRender = () => new Promise((resolve) => {
  const router = Router.instance;
  const listener = () => {
    resolve();
    router.off('render', listener);
  }
  router.on('render', listener);
});

describe('<router-link>', async () => {
  const router = new Router([]);
  await router.connect(div());

  beforeEach(async () => {
    await router.push('/');
  });

  it('applies active attribute when used as a decorator', async () => {
    const link = new RouterLink();
    link.appendChild(a('/abc'));
    connect(link);

    expect(link.to).to.equal('/abc');
    expect(link.active).to.be.false;

    await router.push('/abc');

    expect(link.active).to.be.true;
  });

  it('intercepts clicks when used as a decorator');
  // it('intercepts clicks when used as a decorator', async () => {
  //   const link = new RouterLink();
  //   const anchor = a('/abc');
  //   link.appendChild(a('/abc'));
  //   connect(link);

  //   anchor.click();
  //   await nextRender();

  //   expect(link.active).to.be.true;
  // });

  it('applies active attribute when used as a standalone', async () => {
    const link = new RouterLink();
    link.to = '/abc';
    connect(link);

    expect(link.to).to.equal('/abc');
    expect(link.active).to.be.false;

    await router.push('/abc');

    expect(link.active).to.be.true;
  });

  it('intercepts clicks when used as a standalone', async () => {
    const link = new RouterLink();
    link.to = '/abc';
    connect(link);

    link.click();
    await nextRender();

    expect(link.active).to.be.true;
  })

  it('can be configured to match exactly', async () => {
    const link = new RouterLink();
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
    link.setAttribute('to', '/abc');
    link.disabled = true;

    push('/abc');
    link.onChange();

    expect(link.active).to.be.false;
  });
});