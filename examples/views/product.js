export default class Product extends HTMLElement {
  static get properties() {
    return {
      product_id: {
        type: String
      }
    }
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Product</h1>
      <p>ID: ${this.product_id}</p>
    `;
  }
}

customElements.define('product-view', Product);