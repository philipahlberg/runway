import Router from './router';

export default class RouterLinkElement extends HTMLElement {
  static install() {
    customElements.define('router-link', this);
  }

  router: Router;
  to: string;

  constructor() {
    super();
    this.to = '';
    this.router = Router.instance;
    this.onClick = this.onClick.bind(this);
  }

  set exact(v: boolean) {
    this.toggleAttribute('exact', v);
  }

  get exact(): boolean {
    return this.hasAttribute('exact');
  }

  set active(v: boolean) {
    this.toggleAttribute('active', v);
  }

  get active(): boolean {
    return this.hasAttribute('active');
  }

  set disabled(v: boolean) {
    this.toggleAttribute('disabled', v);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  connectedCallback() {
    this.addEventListener('click', this.onClick);
    let link = this.querySelector('a');
    if (link != null) {
      this.to = link.href;
    } else {
      this.to = this.getAttribute('to') || '';
    }

    this.router.on('navigation', this.onChange);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.router.off('navigation', this.onChange);
  }

  toggleAttribute(name: string, predicate: boolean) {
    if (predicate) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  onClick(event: MouseEvent) {
    // Don't handle clicks with modifiers
    if (
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    if (event.defaultPrevented) {
      return;
    }

    // Don't handle right click
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    if (this.disabled || !this.to) {
      return;
    } else {
      this.router.push(this.to);
    }
  }

  onChange() {
    if (!this.to) {
      this.active = false;
      return;
    }

    const url = decodeURIComponent(location.pathname);
    if (this.to.startsWith('/')) {
      this.active = this.exact
        ? url === this.to
        : url.startsWith(this.to);
    } else {
      this.active = url.endsWith(this.to);
    }
  }
}
