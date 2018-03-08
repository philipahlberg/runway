export default class Products extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Products</h1>
      <slot></slot>
    `;
  }
}

customElements.define('products-view', Products);