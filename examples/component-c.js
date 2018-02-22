import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentC extends ProfilingMixin(HTMLElement) {
  
}

customElements.define('component-c', ComponentC);