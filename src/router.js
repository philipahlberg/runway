import { Routes, ActiveRoute } from './route.js';

const EMPTY = Object.create(null);

export class Router {
  constructor(records, target) {
    console.time('new Router');
    this.views = [];
    this.routes = [];
    this.view = null;
    this.target = target;
    this.routes = new Routes(records);

    window.addEventListener('popstate', () => {
      const url = decodeURIComponent(location.pathname);
      const matched = this.resolve(url);
      this.render(matched, url);
    });

    window.Router = this;

    const url = decodeURIComponent(location.pathname);
    const matched = this.resolve(url);
    console.timeEnd('new Router');
    this.render(matched, url);
  }

  push(url, { data, title } = EMPTY) {
    history.pushState(data, title, url);
    const path = decodeURIComponent(location.pathname);
    const matched = this.resolve(path);
    this.render(matched, path);
  }

  replace(url, { data, title } = EMPTY) {
    history.replaceState(data, title, url);
    const path = decodeURIComponent(location.pathname);
    const matched = this.resolve(path);
    this.render(matched, path);
  }

  resolve(url) {
    let matched = [];
    const flatten = (route) => {
      let matches = route.matches(url);
      if (matches) {
        matched.push(route);
        if (route.children != null) {
          for (const child of route.children) {
            flatten(child);
          }
        }
      }
      return matches;
    }

    for (const route of this.routes) {
      if (flatten(route)) {
        break;
      }
    }

    return matched;
  }

  async render(matched, url) {
    console.time('render');
    console.time('import');
    const components = await Promise.all(
      matched.map(route => route.import())
    );
    console.timeEnd('import');

    let parent;
    const length = matched.length;
    for (let i = 0; i < length; i++) {
      const route = matched[i];
      // A view is an existing component from a previous render
      const view = this.views[i];
      // The component class
      const Component = components[i];

      // The view is reusable if it's an instance of the correct component
      const reusable = view instanceof Component;
      // Obtain an instance of the component
      let instance;
      if (reusable) {
        instance = view;
      } else {
        // If a fresh instance is needed, use the component constructor
        instance = new Component();
        // If the fresh instance is replacing an old view,
        // remove the old view
        if (parent && view) {
          parent.removeChild(view);
        }
        // Save the new instance in place of the old one
        this.views[i] = instance;
      }

      // Create an active route based on the route and url
      const active = new ActiveRoute(route, url);
      instance.route = active;

      // Resolve any matching parameters on the component
      const parameters = active.parameters;
      const properties = Component.properties;
      if (properties != null) {
        for (const [key, value] of parameters) {
          if (properties.hasOwnProperty(key)) {
            instance[key] = value;
          }
        }
      }

      // If the view wasn't reusable, it needs to be
      // appended, optionally into a slot.
      if (!reusable && parent != null) {
        if (route.slot) {
          instance.setAttribute('slot', route.slot);
        }
        parent.appendChild(instance);
      }
      parent = instance;
    }

    // Remove redundant views
    const views = this.views;
    for (let i = matched.length; i < views.length; i++) {
      const view = views[i];
      view.parentElement.removeChild(view);
    }

    // Now that the tree of components has been created,
    // mount it in the DOM
    if (this.root != null && this.root !== this.views[0]) {
      this.target.replaceChild(this.views[0], this.root);
    } else {
      this.target.appendChild(this.views[0]);
    }

    this.root = this.views[0];
    console.timeEnd('render');
    this.emit();
  }

  emit() {
    window.dispatchEvent(new Event('location-change'));
  }
}
