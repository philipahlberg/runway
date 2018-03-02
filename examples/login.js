import { ProfilingMixin } from './profiling-mixin.js';
import Router from './routes.js';
import { login } from './auth.js';

export default class Login extends ProfilingMixin(HTMLElement) {
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
      <h1>Login</h1>
      <input type="password">
      <p>hint: the password is 'secret'</p>
    `;

    const input = this.shadowRoot.querySelector('input');
    input.addEventListener('change', e => {
      if (e.target.value === 'secret') {
        login();
        console.log('Login successful.');
        Router.push('/admin');
      }
    });
  }
}

customElements.define('login-view', Login);