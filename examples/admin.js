import { ProfilingMixin } from './profiling-mixin.js';

export default class Admin extends ProfilingMixin(HTMLElement) {
  connectedCallback() {
    super.connectedCallback();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Admin</h1>
    `;
  }
}

customElements.define('admin-view', Admin);