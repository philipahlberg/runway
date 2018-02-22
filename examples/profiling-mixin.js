export const ProfilingMixin = (SuperClass) => (class extends SuperClass {
  connectedCallback() {
    this.log('connected');
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  disconnectedCallback() {
    this.log('disconnected');
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    this.log('attribute changed', {
      attribute, oldValue, newValue
    });

    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  adoptedCallback() {
    this.log('adopted');
    if (super.adoptedCallback) {
      super.adoptedCallback();
    }
  }
  
  log(...args) {
    console.log(`[${this.constructor.name}]`, ...args);
  }
});