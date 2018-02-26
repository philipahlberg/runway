import { Routes, ActiveRoute } from './route.js';

const EMPTY = Object.create(null);

export class Router {
  constructor(records, target) {
    this.views = [];
    this.routes = [];
    this.activeRoutes = [];
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
    // Importing early in case both network
    // and device is slow, but not awaiting
    // it just yet.
    const load = Promise.all(
      matched.map(route => route.import())
    );

    console.time('render');
    // Find the index at which the matched routes
    // differ from the active routes.
    let start;
    for (let i = 0; i < matched.length; i++) {
      const match = matched[i];
      if (this.activeRoutes.length < i + 1) {
        start = i;
        break;
      } else {
        const active = this.activeRoutes[i];
        if (match !== active) {
          start = i;
          break;
        }
      }
    }

    this.activeRoutes = matched;

    // Remove the obsolete elements
    if (start > 0 && this.views.length > 0) {
      const el = this.views[start];
      el.remove();
      this.views = this.views.slice(0, start);
    }

    // Create the new elements
    const components = await load;
    const elements = components.slice(start)
      .map(Component => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let k = 0; k < elements.length - 1; k++) {
      const parent = elements[k];
      const child = elements[k + 1];
      parent.append(child);
    }

    this.views = this.views.concat(elements);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    for (let k = 0; k < this.views.length; k++) {
      const view = this.views[k];
      const route = matched[k];
      const Component = components[k];

      const active = new ActiveRoute(route, url);

      const parameters = active.parameters;
      const options = Component.properties;
      if (options != null) {
        // Resolve parameters from paths
        for (const [key, value] of parameters) {
          if (options.hasOwnProperty(key)) {
            view[key] = value;
          }
        }

        // Resolve additional properties from route
        for (const key in route.properties) {
          if (options.hasOwnProperty(key)) {
            const value = route.properties[key];
            view[key] = value;
          }
        }
      }

      view.route = active;

      if (route.slot) {
        view.setAttribute('slot', route.slot);
      }
    }

    if (start > 0) {
      // Connect the new elements to the deepest reused element,
      // implicitly rendering them
      this.views[start - 1].append(elements[0]);
    } else {
      // Remove anything currently rendered
      const root = this.target;
      while (root.firstChild) {
        root.removeChild(root.firstChild);
      }
      // Add the root element to the target
      this.target.append(this.views[0]);
    }

    console.timeEnd('render');
    this.emit();
  }

  emit() {
    window.dispatchEvent(new Event('location-change'));
  }
}
