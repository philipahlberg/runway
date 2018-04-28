export declare class RouterLink extends HTMLElement {
    static observedAttributes: string[];
    static tagName: string;
    private router;
    static install(): void;
    constructor();
    to: string;
    exact: boolean;
    active: boolean;
    disabled: boolean;
    attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    toggleAttribute(name: string, predicate: boolean): void;
    test(path: string): boolean;
    onClick(event: MouseEvent): void;
    onChange(): void;
}
export default RouterLink;
