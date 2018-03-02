export class SimpleComponent extends HTMLElement {}

export class ParamComponent extends HTMLElement {
  static get properties() {
    return {
      param: {
        type: String
      }
    }
  }
}

export const AsyncComponent = () => Promise.resolve(SimpleComponent);

customElements.define('simple-component', SimpleComponent);
customElements.define('param-component', ParamComponent);