import api from '/api.js';

export default class Dashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const user = api.getUser();

    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Dashboard</h1>
      Hello, ${user.signedIn ? user.name : 'guest'}!
    `;
  }
}

customElements.define('dashboard-view', Dashboard);