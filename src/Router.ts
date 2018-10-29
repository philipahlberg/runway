import { Route } from './Route';
import { decode, pushState, replaceState, popState } from './utils';
import { RouteOptions, Component } from './types';

export interface SearchResult {
  matched: Route[];
  path: string;
}

export class Router extends EventTarget {
  isConnected: boolean;
  routes: Route[];
  elements: HTMLElement[];
  activeRoutes: Route[];
  root?: HTMLElement;

  constructor(options: RouteOptions[]) {
    super();
    this.isConnected = false;
    this.elements = [];
    this.activeRoutes = [];
    this.routes = options.map(option => new Route(option));
    this.onPopstate = this.onPopstate.bind(this);
  }

  /**
   * Connect the router to an element.
   * This checks the current location for matching,
   * and renders those matched elements.
   */
  async connect(root: HTMLElement): Promise<void> {
    window.addEventListener('popstate', this.onPopstate);
    this.isConnected = true;
    this.root = root;
    const to = decode(location.pathname);
    const { matched, path } = this.match(to);
    replaceState(path);
    await this.render(matched);
  }

  /**
   * Disconnect the router from it's current root element.
   * This removes all the elements currently rendered, and
   * removes all listeners, effectively leaving the router inactive.
   */
  disconnect(): void {
    window.removeEventListener('popstate', this.onPopstate);
    this.isConnected = false;
    this.activeRoutes = [];
    this.root = undefined;
    this.teardown();
  }

  private onPopstate(): void {
    const to = decode(location.pathname);
    const { matched, path } = this.match(to);
    // TODO: is this ever true?
    if (to !== path) {
      replaceState(path);
    }
    this.emit('change');
    this.render(matched);
  }

  /**
   * Push a history entry onto the stack.
   */
  async push(to: string): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    pushState(path);
    this.emit('change');
    await this.render(matched);
  }

  /**
   * Replace the topmost entry in the history stack.
   */
  async replace(to: string): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    replaceState(path);
    this.emit('change');
    await this.render(matched);
  }

  /**
   * Pop the top `n` entries off of history stack.
   */
  pop(n: number = 1) {
    // triggers a popstate event, so rendering
    // happens in this.onPopstate.
    popState(n);
  }

  private search(path: string, routes: Route[], matched: Route[]): SearchResult {
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
   * Search for the elements that would match the given path.
   * If a redirect is encountered, it will be followed.
   * The resulting path and the matched elements are returned.
   */
  private match(path: string): SearchResult {
    return this.search(path, this.routes, []);
  }

  /**
   * Render the given routes.
   * The routes are assumed to be nested.
   */
  private async render(matchedRoutes: Route[]) {
    if (this.root == null) {
      return;
    }

    // Importing early, but deliberately not awaiting
    const load = Promise.all(matchedRoutes.map(route => route.import()));

    // Find the index at which the matched routes
    // differ from the active routes.
    let startIndex;
    const activeRoutes = this.activeRoutes;
    const length = Math.min(matchedRoutes.length, activeRoutes.length);
    for (startIndex = 0; startIndex < length; startIndex++) {
      if (matchedRoutes[startIndex] !== activeRoutes[startIndex]) break;
    }

    this.activeRoutes = matchedRoutes;

    // Remove the obsolete elements from the DOM
    const removals = this.elements.slice(startIndex);
    while (removals.length > 0) {
      const element = removals.pop();
      if (element && element.parentElement) {
        element.parentElement.removeChild(element!);
      }
    }

    // Discard references to the removed elements
    this.elements = this.elements.slice(0, startIndex);

    // Wait for any asynchronous components to load
    const components = await load;
    // Create the new elements
    const additions = components
      .slice(startIndex)
      .map((Component: Component) => new Component());

    this.elements = this.elements.concat(additions);

    // Add slot attributes if needed
    for (let i = startIndex; i < this.elements.length; i++) {
      const element = this.elements[i];
      const route = this.activeRoutes[i];
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
      if (startIndex > 0) {
        // Some reuse
        // Connect the new elements to the deepest reused element,
        // implicitly rendering them
        this.elements[startIndex - 1].appendChild(additions[0]);
      } else {
        // No reuse
        this.root.appendChild(this.elements[0]);
      }
    }
  }

  /**
   * Update all `:param` bindings and `properties` functions in the tree.
   */
  private updateProperties() {
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      const route = this.activeRoutes[i];
      const snapshot = route.snapshot(window.location);
      const properties = (route.properties!)(snapshot);
      const keys = Object.keys(properties);
      for (const key of keys) {
        element[key] = properties[key];
      }
    }
  }

  /**
   * Remove all currently active elements.
   */
  private teardown() {
    while (this.elements.length > 0) {
      const element = this.elements.pop();
      // need to use parentElement.removeChild()
      // (as opposed to element.remove())
      // to avoid bug in Edge
      if (element && element.parentElement) {
        element.parentElement.removeChild(element!);
      }
    }
  }

  private emit(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

export default Router;
