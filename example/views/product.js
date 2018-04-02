export default class Product extends HTMLElement {
  static get properties() {
    return {
      product_id: {
        type: String
      }
    }
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set product_id(value) {
    this._id = value;
    if (this.isConnected) {
      this.render();
    }
  }

  get product_id() {
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
    this.content.textContent = `ID: ${this.product_id}`;
  }
}

customElements.define('product-view', Product);