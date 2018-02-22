import { RouterMixin } from './router-mixin.js';

export class RouterLinkElement extends RouterMixin(HTMLElement) {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  set to(v) {
    this.setAttribute('to', v);
  }

  get to() {
    return this.getAttribute('to');
  }

  set exact(v) {
    this.toggleAttribute('exact', v);
  }

  get exact() {
    return this.hasAttribute('exact');
  }

  set active(v) {
    this.toggleAttribute('active', v);
  }

  get active() {
    return this.hasAttribute('active');
  }

  set disabled(v) {
    this.toggleAttribute('disabled', v);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.onClick);
    addEventListener('location-change', this.onChange);
  }

  disconnectedCallback() {
    removeEventListener('location-change', this.onChange);
    super.disconnectedCallback();
  }

  onClick() {
    if (this.disabled) {
      return;
    } else {
      this.router.push(this.href);
    }
  }

  onChange(event) {
    const url = decodeURIComponent(location.pathname);
    if (this.href.startsWith('/')) {
      this.active = this.exact
        ? url === this.href
        : url.startsWith(this.href);
    } else {
      this.active = url.endsWith(this.href);
    }
  }
}

export default RouterLinkElement;