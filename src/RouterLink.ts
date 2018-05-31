import { Router } from './Router';
import { decode } from './utils';

export class RouterLink extends HTMLElement {
  static observedAttributes = ['disabled', 'to'];
  static tagName = 'router-link';
  private router: Router;

  static define() {
    customElements.define(this.tagName, this);
  }

  constructor() {
    super();
    this.router = Router.instance;
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  set to(v: string) {
    this.setAttribute('to', v);
  }

  get to() {
    return this.getAttribute('to') as string;
  }

  set exact(v: boolean) {
    this.toggleAttribute('exact', v);
    this.active = this.test(decode(location.pathname));
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

  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }

    if (attr === 'disabled') {
      const hasValue = newValue != null;
      if (hasValue) {
        this.active = false;
        this.router.off('render', this.onChange);
      } else {
        this.router.on('render', this.onChange);
        this.onChange();
      }
    } else if (attr === 'to') {
      const a = this.querySelector('a');
      if (a) {
        a.href = newValue;
      }
      this.active = this.test(decode(location.pathname));
    }
  }

  connectedCallback() {
    const a = this.querySelector('a');
    if (a) {
      if (!this.to) {
        this.to = decode(a.pathname);
      } else {
        a.href = this.to;
      }
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
    if (predicate != null) {
      if (predicate) {
        this.setAttribute(name, '');
      } else {
        this.removeAttribute(name);
      }
    } else {
      this.toggleAttribute(name, !this.hasAttribute(name));
    }
  }

  test(path: string): boolean {
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
    if (
      // Ignore clicks with modifiers
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      // Ignore prevented clicks
      event.defaultPrevented ||
      // Ignore right mouse button clicks
      (event.button !== undefined &&
      event.button !== 0)
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
    this.active = this.test(decode(location.pathname));
  }
}

export default RouterLink;
