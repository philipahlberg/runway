import Router from './router';

export class RouterLink extends HTMLElement {
  static observedAttributes = ['disabled'];
  static tagName = 'router-link';
  router: Router;

  static install() {
    customElements.define(this.tagName, this);
  }

  constructor() {
    super();
    this.router = Router.instance;
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  get anchor() {
    return this.querySelector('a');
  }

  set to(v: string) {
    this.anchor!.href = v;
    const path = decodeURIComponent(location.pathname);
    this.active = this.match(path);
  }

  get to(): string {
    return decodeURIComponent(this.anchor!.pathname);
  }

  set exact(v: boolean) {
    this.toggleAttribute('exact', v);
    const path = decodeURIComponent(location.pathname);
    this.active = this.match(path);
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

  attributesChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (attr === 'disabled') {
      const hasValue = newValue != null;
      if (hasValue) {
        this.active = false;
        this.router.off('render', this.onChange);
      } else {
        this.router.on('render', this.onChange);
        this.onChange();
      }
    }
  }

  connectedCallback() {
    this.addEventListener('click', this.onClick);
    this.router.on('render', this.onChange);
    this.onChange();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.router.off('render', this.onChange);
  }

  toggleAttribute(name: string, predicate: boolean) {
    if (predicate) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  match(path: string): boolean {
    const to = this.to;
    if (to.startsWith('/')) {
      return this.exact
        ? path === to
        : path.startsWith(to);
    } else {
      return path.endsWith(to);
    }
  }

  onClick(event: MouseEvent) {
    // Ignore clicks with modifiers
    if (
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    // Ignore prevented clicks
    if (event.defaultPrevented) {
      return;
    }

    // Ignore right mouse button clicks
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    const to = this.to;
    if (this.disabled || !to) {
      return;
    } else {
      this.router.push(to);
    }
  }

  onChange() {
    const path = decodeURIComponent(location.pathname);
    this.active = this.match(path);
  }
}

export default RouterLink;
