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
    const props = { param: this.param };
    this.log({ props });
  }
}

customElements.define('component-b', ComponentB);