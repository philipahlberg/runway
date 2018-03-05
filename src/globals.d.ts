interface HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributesChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;  
}
