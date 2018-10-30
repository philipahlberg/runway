import { Router } from './Router';
import { decode } from './utils';

export class RouterLink extends HTMLElement {
  static observedAttributes = ['disabled', 'to'];
  private static router: Router;

  static use(router: Router) {
    this.router = router;
  }

  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  set to(v: string | null) {
    if (v !== null) {
      this.setAttribute('to', v);
    } else {
      this.removeAttribute('to');
    }
  }

  get to(): string | null {
    return this.getAttribute('to');
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

  private get router(): Router {
    return RouterLink.router;
  }

  attributeChangedCallback(attr: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }

    if (attr === 'disabled') {
      if (newValue != null) {
        this.active = false;
      } else {
        this.onChange();
      }
    } else if (attr === 'to') {
      const a = this.querySelector('a');
      if (a !== null) {
        a.setAttribute('href', newValue);
      }
      this.onChange();
    }
  }

  connectedCallback() {
    if (this.to === null) {
      const a = this.querySelector('a');
      if (a !== null) {
        this.to = decode(a.pathname);
      }
    }
    this.addEventListener('click', this.onClick);
    this.router.addEventListener('change', this.onChange);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.router.removeEventListener('change', this.onChange);
  }

  test(path: string): boolean {
    const to = this.to;
    if (to === null) return false;

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
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    if (this.disabled || this.to === null) {
      return;
    } else {
      this.router.push(this.to);
    }
  }

  onChange() {
    if (this.disabled) return;
    this.active = this.test(decode(location.pathname));
  }
}

export default RouterLink;
