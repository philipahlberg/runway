import { ProfilingMixin } from './profiling-mixin.js';

export default class Users extends ProfilingMixin(HTMLElement) {
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
      <h1>Users</h1>
      <slot></slot>
    `;
  }
}

customElements.define('users-view', Users);