import { ProfilingMixin } from './profiling-mixin.js';

export default class Dashboard extends ProfilingMixin(HTMLElement) {
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
      <h1>Dashboard</h1>
      <slot>
        Nothing to see here.
      </slot>
    `;
  }
}

customElements.define('dashboard-view', Dashboard);