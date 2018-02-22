import { ProfilingMixin } from './profiling-mixin.js';

export default class ComponentA extends ProfilingMixin(HTMLElement) {

}

customElements.define('component-a', ComponentA);