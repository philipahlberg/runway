import Router from './router';

export class RouterLink extends HTMLElement {
  static observedAttributes = ['disabled'];
  static tagName = 'router-link';
  router: Router;
  to?: string;

  static install() {
    customElements.define(this.tagName, this);
  }

  constructor() {
    super();
    this.router = Router.instance;
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
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
    let link = this.querySelector('a');
    if (link != null) {
      this.to = link.pathname;
    } else if (this.to != null) {
      this.setAttribute('to', this.to);
    } else {
      this.to = this.getAttribute('to') || '';
    }

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

export default RouterLink;
