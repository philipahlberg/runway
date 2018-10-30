import router from '/router.js';
import api from '/api.js';

export default class SignIn extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Sign In</h1>
      <form id="sign-in-form">
        <label>
          Username
          <input type="username" name="name">
        </label>
        <label>
          Password
          <input type="password" name="password">
        </label>
        <button type="submit">Submit</button>
      </form>
    `;

    this.shadowRoot.querySelector('#sign-in-form')
      .addEventListener('submit', this.onSubmit);
  }

  onSubmit(event) {
    event.preventDefault();
    const { name, password } = event.target.elements;
    const success = api.signIn(name.value, password.value);
    if (success) {
      router.push('/admin');
    }
  }
}

customElements.define('sign-in-view', SignIn);