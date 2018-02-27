import { Route, ActiveRoute } from './route.js';

const EMPTY = Object.create(null);

export default class Router {
  constructor(records, target) {
    this.views = [];
    this.matched = [];
    this.routes = records.map(record => new Route(record));
    this.onPopstate = this.onPopstate.bind(this);

    window.Router = this;
    
    if (target) {
      this.connect(target);
    }
  }

  connect(target) {
    this.target = target;
    window.addEventListener('popstate', this.onPopstate);
    const url = decodeURIComponent(location.pathname);
    const { matched } = this.resolve(url);
    return this.render(matched);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
    while (this.views.length > 0) {
      const view = this.views.pop();
      view.remove();
    }
    this.matched = [];
    this.target = null;
  }

  onPopstate() {
    const url = decodeURIComponent(location.pathname);
    const { matched } = this.resolve(url);
    this.render(matched);
  }

  push(path, { data, title } = EMPTY) {
    path = decodeURIComponent(path);
    const { matched, url } = this.resolve(path);
    history.pushState(data, title, url);
    return this.render(matched);
  }

  replace(path, { data, title } = EMPTY) {
    path = decodeURIComponent(path);
    const { matched, url } = this.resolve(path);
    history.replaceState(data, title, url);
    return this.render(matched);
  }

  resolve(url) {
    let matched = [];

    const search = (routes) => {
      // Find a starting match
      const route = routes.find(route => route.matches(url));
      if (route) {
        matched.push(route);
        if (route.redirect) {
          // transfer any matched parameters
          const matched = route.matched(url);
          url = route.transfer(matched, route.redirect);
          // and start over
          return this.resolve(url);
        } else if (route.children) {
          // Search through the children
          return search(route.children);
        } else {
          // End the search here
          return { matched, url };
        }
      } else {
        return { matched, url };
      }
    }

    return search(this.routes);
  }

  async render(matched) {
    // Importing early in case both network
    // and device is slow, but not awaiting
    // it just yet.
    const load = Promise.all(
      matched.map(route => route.import())
    );

    // Find the index at which the matched routes
    // differ from the active routes.
    let start;
    for (let i = 0; i < matched.length; i++) {
      const match = matched[i];
      if (this.matched.length < i + 1) {
        start = i;
        break;
      } else {
        const active = this.matched[i];
        if (match !== active) {
          start = i;
          break;
        }
      }
    }

    if (start == null) {
      start = matched.length;
    }

    this.matched = matched;

    // Remove the obsolete elements
    const removals = this.views.slice(start);
    if (removals.length > 0) {
      removals[0].remove();
    }

    this.views = this.views.slice(0, start);

    const components = await load;
    // Create the new elements
    const additions = components.slice(start)
      .map(Component => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let k = 0; k < additions.length - 1; k++) {
      const parent = additions[k];
      const child = additions[k + 1];
      parent.append(child);
    }

    this.views = this.views.concat(additions);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    const url = decodeURIComponent(location.pathname);
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

    // If there are any additions, they need to be rendered
    if (additions.length > 0) {
      if (start > 0) {
        // Some reuse
        // Connect the new elements to the deepest reused element,
        // implicitly rendering them
        this.views[start - 1].append(additions[0]);
      } else {
        // No reuse
        this.target.append(this.views[0]);
      }
    }
  }
}
