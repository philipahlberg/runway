import EventEmitter from './event-emitter';
import Route, { Record } from './route';
import { EMPTY } from './utils';

export interface SearchResult {
  matched: Route[];
  path: string;
}

export interface NavigationOptions {
  data: any;
  title: string;
}

export class Router extends EventEmitter {
  static instance: Router;
  elements: HTMLElement[];
  matched: Route[];
  routes: Route[];
  middleware: Function[];
  isConnected: boolean;
  target?: HTMLElement;

  constructor(records: Record[]) {
    super();
    this.isConnected = false;
    this.elements = [];
    this.matched = [];
    this.middleware = [];
    this.routes = records.map(record => new Route(record));
    this.onPopstate = this.onPopstate.bind(this);
    Router.instance = this;
  }

  async connect(target: HTMLElement) {
    this.isConnected = true;
    this.target = target;
    window.addEventListener('popstate', this.onPopstate);
    const currentPath = decodeURIComponent(location.pathname);
    const { matched, path } = this.match(currentPath);

    history.replaceState(history.state, document.title, path);
    await this.render(matched);
    this.emit('connect');
  }

  disconnect() {
    this.isConnected = false;
    window.removeEventListener('popstate', this.onPopstate);
    this.teardown();
    this.matched = [];
    this.target = undefined;
    this.emit('disconnect');
  }

  onPopstate() {
    const to = decodeURIComponent(location.pathname);
    const { matched, path } = this.match(to);
    if (to !== path) {
      history.replaceState(history.state, document.title, path);
    }
    this.emit('pop');
    this.render(matched);
  }

  push(to: string, options: NavigationOptions = EMPTY) {
    to = decodeURIComponent(to);
    const { matched, path } = this.match(to);
    const { data, title } = options;
    history.pushState(data, title, path);
    this.emit('push');
    return this.render(matched);
  }

  replace(to: string, options: NavigationOptions = EMPTY) {
    to = decodeURIComponent(to);
    const { matched, path } = this.match(to);
    const { data, title } = options;
    history.replaceState(data, title, path);
    this.emit('replace');
    return this.render(matched);
  }

  pop(entries: number = -1) {
    // triggers onPopstate(), so no need to render
    // in this method call
    history.go(entries);
  }

  search(path: string, routes: Route[], matched: Route[]): SearchResult {
    const route = routes
      .find(r => r.matches(path) && r.guard());

    if (route) {
      matched.push(route);
      if (route.redirect) {
        // transfer any matched parameters
        const from = route.matched(path);
        const to = route.redirect;
        const redirected = route.transfer(from, to);
        // and start over
        return this.search(redirected, this.routes, []);
      } else if (route.children) {
        // Search through the children
        return this.search(path, route.children, matched);
      } else {
        return { matched, path };
      }
    } else {
      // End the search here
      return { matched, path };
    }
  }

  match(path: string): SearchResult {
    return this.search(path, this.routes, []);
  }

  async render(matched: Route[]) {
    if (this.target == undefined) {
      return;
    }

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
    const removals = this.elements.slice(start);
    while (removals.length > 0) {
      const element = removals.pop();
      element!.remove();
    }

    this.elements = this.elements.slice(0, start);

    const components = await load;
    // Create the new elements
    const additions = components.slice(start)
      // TODO: fix type
      .map((Component: any) => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let i = 0; i < additions.length - 1; i++) {
      const parent = additions[i];
      const child = additions[i + 1];
      parent.appendChild(child);
    }

    this.elements = this.elements.concat(additions);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    const url = decodeURIComponent(location.pathname);
    for (let i = 0; i < this.elements.length; i++) {
      // TODO: fix type
      const element: any = this.elements[i];
      const route = matched[i];
      // TODO: fix type
      const Component: any = components[i];
      const options = Component.properties;
      if (options != undefined) {
        const snapshot = route.snapshot(url);
        const parameters = snapshot.parameters;
        // Resolve parameters from paths
        for (const [key, value] of parameters) {
          if (options.hasOwnProperty(key)) {
            element[key] = value;
          }
        }

        // Resolve additional properties from route
        const properties = route.properties(snapshot);
        for (const key in properties) {
          if (options.hasOwnProperty(key)) {
            const value = properties[key];
            element[key] = value;
          }
        }
      }

      if (route.slot) {
        element.setAttribute('slot', route.slot);
      }
    }

    // If there are any additions, they need to be rendered
    if (additions.length > 0) {
      if (start > 0) {
        // Some reuse
        // Connect the new elements to the deepest reused element,
        // implicitly rendering them
        this.elements[start - 1].appendChild(additions[0]);
      } else {
        // No reuse
        this.target.appendChild(this.elements[0]);
      }
    }

    this.emit('render');
  }

  teardown() {
    while (this.elements.length > 0) {
      const element = this.elements.pop();
      element!.remove();
    }
  }
}

export default Router;
