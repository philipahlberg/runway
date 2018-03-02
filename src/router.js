import { Route, ActivatedRoute } from './route.js';
import { EMPTY } from './utils.js';

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
    const path = decodeURIComponent(location.pathname);
    const { matched, url } = this.match(path);
    history.replaceState(null, null, url);
    return this.render(matched);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
    this.teardown();
    this.matched = [];
    this.target = null;
  }

  onPopstate() {
    const path = decodeURIComponent(location.pathname);
    const { matched } = this.match(path);
    this.render(matched);
  }

  push(url, { data, title } = EMPTY) {
    url = decodeURIComponent(url);
    const { matched, path } = this.match(url);
    history.pushState(data, title, path);
    return this.render(matched);
  }

  replace(url, { data, title } = EMPTY) {
    url = decodeURIComponent(url);
    const { matched, path } = this.match(url);
    history.replaceState(data, title, path);
    return this.render(matched);
  }

  match(path) {
    const search = (routes, matched) => {
      // Find a starting match
      const route = routes
        .find(r => r.matches(path) || r.guard());

      if (route) {
        matched.push(route);
        if (route.redirect != null) {
          // transfer any matched parameters
          const matched = route.matched(path);
          const redirected = route.transfer(matched, route.redirect);
          // and start over
          return this.match(redirected);
        } else if (route.children) {
          // Search through the children
          return search(route.children, matched);
        } else {
          return { matched, path };
        }
      } else {
        // End the search here
        return { matched, path };
      }
    }

    return search(this.routes, []);
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
    while (removals.length > 0) {
      const element = removals.pop();
      element.remove();
    }

    this.views = this.views.slice(0, start);

    const components = await load;
    // Create the new elements
    const additions = components.slice(start)
      .map(Component => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let i = 0; i < additions.length - 1; i++) {
      const parent = additions[i];
      const child = additions[i + 1];
      parent.append(child);
    }

    this.views = this.views.concat(additions);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    const url = decodeURIComponent(location.pathname);
    for (let i = 0; i < this.views.length; i++) {
      const view = this.views[i];
      const route = matched[i];
      const Component = components[i];

      const active = new ActivatedRoute(route, url);

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

  teardown() {
    while (this.views.length > 0) {
      const view = this.views.pop();
      view.remove();
    }
  }
}
