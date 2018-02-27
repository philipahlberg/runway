import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentB extends ProfilingMixin(HTMLElement) {
  static get properties() {
    return {
      param: {
        type: String
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: 'open' });
    const text = document.createTextNode('ComponentB');
    this.shadowRoot.append(text);
    const slot = document.createElement('slot');
    this.shadowRoot.append(slot);
  }
}

customElements.define('component-b', ComponentB);