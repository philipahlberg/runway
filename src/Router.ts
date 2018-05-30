import { EventEmitter } from './EventEmitter';
import { Route } from './Route';
import { History } from './History';
import { decode } from './utils';
import { Record, Constructor, NavigationOptions } from './types';

export interface SearchResult {
  matched: Route[];
  path: string;
}

export class Router extends EventEmitter {
  static instance: Router;
  isConnected: boolean;
  history: History;
  routes: Route[];
  elements: HTMLElement[];
  matched: Route[];
  root?: HTMLElement;

  constructor(records: Record[]) {
    super();
    this.isConnected = false;
    this.elements = [];
    this.matched = [];
    this.routes = records.map(record => new Route(record));
    this.onpop = this.onpop.bind(this);
    this.history = new History(this.onpop);
    Router.instance = this;
  }

  /**
   * Connect the router to an element.
   * This checks the current location for matching,
   * and renders those matched elements.
   */
  async connect(root: HTMLElement): Promise<void> {
    this.isConnected = true;
    this.root = root;
    const to = decode(location.pathname);
    const { matched, path } = this.match(to);
    this.history.connect();
    this.history.replace(path);
    await this.render(matched);
    this.emit('connect');
  }

  /**
   * Disconnect the router from it's current root element.
   * This removes all the elements currently rendered, and
   * removes all listeners, effectively leaving the router inactive.
   */
  disconnect(): void {
    this.isConnected = false;
    this.matched = [];
    this.root = undefined;
    this.teardown();
    this.history.disconnect();
    this.emit('disconnect');
  }

  /**
   * @private
   */
  onpop(to: string): void {
    const { matched, path } = this.match(to);
    if (to !== path) {
      this.history.replace(path);
    }
    this.emit('pop');
    this.render(matched);
  }

  /**
   * Push a history entry onto the stack.
   */
  push(to: string, options?: NavigationOptions): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    this.history.push(path, options);
    this.emit('push');
    return this.render(matched);
  }

  /**
   * Replace the topmost entry in the history stack.
   */
  replace(to: string, options?: NavigationOptions): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    this.history.replace(path, options);
    this.emit('replace');
    return this.render(matched);
  }

  /**
   * Traverse through the history stack.
   */
  go(entries: number) {
    // triggers onpop(), so no need to render
    // in this method call
    this.history.go(entries);
  }

  /**
   * @private
   */
  search(path: string, routes: Route[], matched: Route[]): SearchResult {
    const route = routes.find(r => r.matches(path) && r.guard());

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

  /**
   * @private
   * Search for the elements that would match the given path.
   * If a redirect is encountered, it will be followed.
   * The resulting path and the matched elements are returned.
   */
  match(path: string): SearchResult {
    return this.search(path, this.routes, []);
  }

  /**
   * @private
   * Render the given routes.
   * The routes are assumed to be nested.
   */
  async render(matched: Route[]) {
    if (this.root == undefined) {
      return;
    }

    // Importing early, but deliberately not awaiting
    const load = Promise.all(matched.map(route => route.import()));

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

    // Remove the obsolete elements from the DOM
    const removals = this.elements.slice(start);
    while (removals.length > 0) {
      const element = removals.pop();
      if (element && element.parentElement) {
        element.parentElement.removeChild(element!);
      }
    }

    // Discard references to the removed elements
    this.elements = this.elements.slice(0, start);

    // Wait for any asynchronous components to load
    const components = await load;
    // Create the new elements
    const additions = components
      .slice(start)
      .map((Component: Constructor<HTMLElement>) => new Component());

    this.elements = this.elements.concat(additions);

    // Add slot attributes if needed
    for (let i = start; i < this.elements.length; i++) {
      const element = this.elements[i];
      const route = this.matched[i];
      if (route.slot) {
        element.setAttribute('slot', route.slot);
      }
    }

    // Combine the newly created elements in order
    // Note: they are not connected to the DOM here
    for (let i = 0; i < additions.length - 1; i++) {
      const parent = additions[i];
      const child = additions[i + 1];
      parent.appendChild(child);
    }

    // Resolve any new properties
    this.updateProperties();

    // If there are any additions, they need to be rendered
    if (additions.length > 0) {
      if (start > 0) {
        // Some reuse
        // Connect the new elements to the deepest reused element,
        // implicitly rendering them
        this.elements[start - 1].appendChild(additions[0]);
      } else {
        // No reuse
        this.root.appendChild(this.elements[0]);
      }
    }

    this.emit('render');
  }

  /**
   * Update all `:param` bindings and `properties` functions in the tree.
   */
  updateProperties() {
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      const options = customElements.get(
        element.tagName.toLowerCase()
      ).properties;
      const route = this.matched[i];

      if (options != undefined) {
        const snapshot = route.snapshot(window.location);
        const parameters = snapshot.parameters;
        // Resolve parameters from path
        for (const [key, value] of parameters) {
          if (options.hasOwnProperty(key)) {
            element[key] = value;
          }
        }

        // Resolve additional properties from route
        const properties = route.properties(snapshot);
        const keys = Object.keys(properties);
        for (const key of keys) {
          if (options.hasOwnProperty(key)) {
            element[key] = properties[key];
          }
        }
      }
    }
  }

  /**
   * Remove all currently active elements.
   */
  teardown() {
    while (this.elements.length > 0) {
      const element = this.elements.pop();
      if (element && element.parentElement) {
        element.parentElement.removeChild(element!);
      }
    }
  }
}

export default Router;
