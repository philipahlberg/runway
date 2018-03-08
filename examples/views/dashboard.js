export default class Dashboard extends HTMLElement {
  static get properties() {
    return {
      user: {
        type: Object
      }
    }
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    const user = this.user;

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