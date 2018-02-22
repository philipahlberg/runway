export const RouterMixin = (SuperClass) => (class extends SuperClass {
  constructor() {
    super();
    this.router = window.Router;
  }

  connectedCallback() {
    const root = this.getRootNode();
    const host = root.host;
    if (host && host.route) {
      this.route = host.route;
    }
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }
});