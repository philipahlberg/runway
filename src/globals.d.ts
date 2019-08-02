interface Element {
    toggleAttribute(qualifiedName: string, force?: boolean): void;
}

interface HTMLElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    adoptedCallback?(): void;
    attributeChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;
}
