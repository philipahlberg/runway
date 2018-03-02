import { ProfilingMixin } from './profiling-mixin.js';

export default class User extends ProfilingMixin(HTMLElement) {
  static get properties() {
    return {
      user_id: {
        type: String
      }
    }
  }

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
      <h1>User</h1>
      <p>ID: ${this.user_id}</p>
    `;
  }
}

customElements.define('user-view', User);