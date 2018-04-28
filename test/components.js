customElements.define('simple-component', class extends HTMLElement {});
customElements.define('param-component', class extends HTMLElement {
  static get properties() {
    return {
      param: {
        type: String
      }
    }
  }
});