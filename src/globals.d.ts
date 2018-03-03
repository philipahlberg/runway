// interface Node {
//   getRootNode(): Node;
//   host: Element;
//   isConnected: boolean;
// }

interface HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  propertiesChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;  
}
