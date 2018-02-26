import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentA extends ProfilingMixin(HTMLElement) {
  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: 'open' });
    const slot = document.createElement('slot');
    slot.name = 'router-view';
    this.shadowRoot.append(slot);
  }
}

customElements.define('component-a', ComponentA);