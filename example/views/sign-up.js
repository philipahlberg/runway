import router from '/router.js';
import api from '/api.js';

export default class SignUp extends HTMLElement {
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
      <h1>Sign Up</h1>
      <form id="sign-up-form">
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

    this.shadowRoot.querySelector('#sign-up-form')
      .addEventListener('submit', this.onSubmit);
  }

  onSubmit(event) {
    event.preventDefault();
    const { name, password } = event.target.elements;
    api.signUp(name.value, password.value);
    api.signIn(name.value, password.value);
    router.push('/admin');
  }
}

customElements.define('sign-up-view', SignUp);