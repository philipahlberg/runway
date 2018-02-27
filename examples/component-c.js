import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentC extends ProfilingMixin(HTMLElement) {
  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: 'open' });
    const text = document.createTextNode('ComponentC');
    this.shadowRoot.append(text);
  }
}

customElements.define('component-c', ComponentC);