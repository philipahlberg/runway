import api from '/api.js';

export default class NewProduct extends HTMLElement {
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
      <h1>New Product</h1>
      <form id="product-form">
        <label>
          Id
          <input type="number" name="id">
        </label>
        <label>
          Name
          <input type="text" name="name">
        </label>
        <button type="submit">Submit</button>
      </form>
    `;

    this.shadowRoot.querySelector('#product-form')
      .addEventListener('submit', this.onSubmit);
  }

  onSubmit(event) {
    event.preventDefault();
    const { id, name } = event.target.elements;
    api.addProduct(id.value, name.value);
    event.target.reset();
  }
}

customElements.define('new-product-view', NewProduct);