export default class Products extends HTMLElement {
  connectedCallback() {
    const a = (href, name) => `<router-link><a href="${href}">${name}</a></router-link>`;

    const products = [
      {
        id: 1,
        name: 'A'
      },
      {
        id: 2,
        name: 'B'
      }
    ].reduce(
      (html, {id, name}) => html += a(`/products/${id}`, name),
      ''
    );

    this.attachShadow({ mode: 'open' });
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
      ${products}
      <slot></slot>
    `;
  }
}

customElements.define('products-view', Products);