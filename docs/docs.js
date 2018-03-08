export default class Docs extends HTMLElement {
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
      <h1>Docs</h1>
      <slot>
        Nothing to see here.
      </slot>
    `;
  }
}

customElements.define('docs-view', Docs);