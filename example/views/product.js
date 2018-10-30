import api from '/api.js';

export default class Product extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set productId(id) {
    this._id = id;
    this.product = api.getProduct(id);
    if (this.isConnected) {
      this.render();
    }
  }

  get productId() {
    return this._id;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }
      </style>
      <h1>Product</h1>
      <div id="content"></div>
    `;

    this.content = this.shadowRoot.querySelector('#content');
    this.render();
  }

  render() {
    this.content.textContent = `
      ID: ${this.product.id}
      Name: ${this.product.name}
    `;
  }
}

customElements.define('product-view', Product);