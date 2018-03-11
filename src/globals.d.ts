interface HTMLElement {
  new(): HTMLElement;
  prototype: HTMLElement;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributesChangedCallback?(attributeName: string, oldValue: string, newValue: string): void;
  [key: string]: any;
}

interface Constructor<T> {
  new (...args: any[]): T;
}

type Dictionary<T> = { [key: string]: T };
type Tuple<T> = [T, T];