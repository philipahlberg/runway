interface HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributesChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;  
}

interface Constructor<T> {
  new (...args: any[]): T;
}

type Dictionary = { [key: string]: string };
type Tuple<T> = [T, T];