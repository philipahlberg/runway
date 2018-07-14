import router from '/routes.js';
import { signup, signin } from '../auth.js';

export default class SignUp extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
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
    signup(name.value, password.value);
    signin(name.value, password.value);
    router.push('/admin');
  }
}

customElements.define('sign-up-view', SignUp);