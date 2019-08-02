import { Router } from './Router';
import { decode } from './utils';

export class RouterLink extends HTMLElement {
    public static observedAttributes = ['disabled', 'to'];
    private static router: Router;

    public static use(router: Router): void {
        this.router = router;
    }

    public constructor() {
        super();
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    public set to(v: string | null) {
        if (v !== null) {
            this.setAttribute('to', v);
        } else {
            this.removeAttribute('to');
        }
    }

    public get to(): string | null {
        return this.getAttribute('to');
    }

    public set exact(v: boolean) {
        this.toggleAttribute('exact', v);
        this.active = this.test(decode(location.pathname));
    }

    public get exact(): boolean {
        return this.hasAttribute('exact');
    }

    public set active(v: boolean) {
        this.toggleAttribute('active', v);
    }

    public get active(): boolean {
        return this.hasAttribute('active');
    }

    public set disabled(v: boolean) {
        this.toggleAttribute('disabled', v);
    }

    public get disabled(): boolean {
        return this.hasAttribute('disabled');
    }

    private get router(): Router {
        return RouterLink.router;
    }

    public attributeChangedCallback(attr: string, oldValue: string, newValue: string): void {
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

    public connectedCallback(): void {
        if (this.to === null) {
            const a = this.querySelector('a');
            if (a !== null) {
                this.to = decode(a.pathname);
            }
        }
        this.addEventListener('click', this.onClick);
        this.router.addEventListener('change', this.onChange);
    }

    public disconnectedCallback(): void {
        this.removeEventListener('click', this.onClick);
        this.router.removeEventListener('change', this.onChange);
    }

    private test(path: string): boolean {
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

    private onClick(event: MouseEvent): void {
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

    private onChange(): void {
        if (this.disabled) return;
        this.active = this.test(decode(location.pathname));
    }
}

export default RouterLink;
