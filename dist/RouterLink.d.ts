import { Router } from './Router';
import { RouterLinkOptions } from './types';
export declare class RouterLink extends HTMLElement {
    static observedAttributes: string[];
    static tagName: string;
    private static router;
    static define(tagName: string | undefined, options: RouterLinkOptions): void;
    constructor();
    to: string;
    exact: boolean;
    active: boolean;
    disabled: boolean;
    readonly router: Router;
    attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    toggleAttribute(name: string, predicate: boolean): void;
    test(path: string): boolean;
    onClick(event: MouseEvent): void;
    onChange(): void;
}
export default RouterLink;
