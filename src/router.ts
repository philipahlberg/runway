import EventEmitter from './event-emitter';
import Route, { Record } from './route';
import History, { Options } from './history';
import { decode, pathname } from './utils';

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

  disconnect(): void {
    this.isConnected = false;
    this.matched = [];
    this.root = undefined;
    this.teardown();
    this.history.disconnect();
    this.emit('disconnect');
  }

  onpop(to: string): void {
    const { matched, path } = this.match(to);
    if (to !== path) {
      this.history.replace(path);
    }
    this.emit('pop');
    this.render(matched);
  }

  push(to: string, options?: Options): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    this.history.push(path, options);
    this.emit('push');
    return this.render(matched);
  }

  replace(to: string, options?: Options): Promise<void> {
    to = decode(to);
    const { matched, path } = this.match(to);
    this.history.replace(path, options);
    this.emit('replace');
    return this.render(matched);
  }

  go(entries: number) {
    // triggers onpop(), so no need to render
    // in this method call
    this.history.go(entries);
  }

  search(path: string, routes: Route[], matched: Route[]): SearchResult {
    const route = routes.find(r => r.matches(path) && r.guard());

    if (route) {
      matched.push(route);
      if (route.redirect) {
        // transfer any matched parameters
        const from = route.matched(pathname(path));
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
    if (this.root == undefined) {
      return;
    }

    // Importing early in case both network
    // and device is slow, but not awaiting
    // it just yet.
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
      element!.remove();
    }

    // Discard the removed elements
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
      const element: HTMLElement = this.elements[i];
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
    this.update();

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

  update() {
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
        for (const key in properties) {
          if (options.hasOwnProperty(key)) {
            const value = properties[key];
            element[key] = value;
          }
        }
      }
    }
  }

  teardown() {
    while (this.elements.length > 0) {
      const element = this.elements.pop();
      element!.remove();
    }
  }
}

export default Router;
