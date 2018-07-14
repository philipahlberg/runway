interface HTMLElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;
  [key: string]: any;
}
