import api from '/api.js';

const createLink = ({ id, name }) => `
  <router-link to="/products/${id}"><a>${name}</a></router-link>
`;

export default class Products extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render = this.render.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        padding: 24px;
      }

      a {
        display: block;
      }
      </style>
      <h1>Products</h1>
      <router-link to="/products/new">
        <a>New</a>
      </router-link>
      <div id="products"></div>
      <slot></slot>
    `;

    api.addEventListener('add-product', this.render);
    this.render();
  }

  disconnectedCallback() {
    api.removeEventListener('add-product', this.render);
  }

  render() {
    const products = api.getProducts();
    const links = products.map(createLink).join('');
    this.shadowRoot.querySelector('#products').innerHTML = links;
  }
}

customElements.define('products-view', Products);