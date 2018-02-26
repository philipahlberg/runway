import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentB extends ProfilingMixin(HTMLElement) {
  static get properties() {
    return {
      param: {
        type: String
      }
    }
  }
}

customElements.define('component-b', ComponentB);