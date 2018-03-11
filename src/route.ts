import Path, { Parameters } from './path';
import Query from './query';
import {
  normalize,
  decode,
  split,
  clone,
  freeze,
  always,
  empty,
  isFunction
} from './utils';

export interface Module {
  default: HTMLElement;
}

export type Component = AsyncComponent | HTMLElement | string;
export type AsyncComponent = () => Promise<HTMLElement | Module>;
export type Guard = () => boolean;
export type Properties = (snapshot: Snapshot) => Dictionary;

export interface Record {
  path: string;
  component: Component;
  exact?: boolean;
  redirect?: string;
  slot?: string;
  guard?: Guard;
  properties?: Properties;
  children?: Record[];
}

export interface Snapshot {
  readonly parameters: Parameters;
  readonly query: Query;
  readonly hash: string;
  readonly matched: string;
}

export interface Location {
  search: string;
  hash: string;
  pathname: string;
}

export class Route extends Path {
  static cache = new Map();
  path: string;
  exact: boolean;
  component: Component;
  children: Route[];
  redirect?: string;
  slot?: string;
  guard: Guard;
  properties: Properties;

  static async import(identifier: Component): Promise<HTMLElement> {
    if (typeof identifier === 'string') {
      // If it's a string, assume that it has
      // been defined, and return the constructor
      // from the element registry
      return customElements.get(identifier);
  
    } else if (isFunction(identifier)) {
      // If it's a function, call it
      let called = (identifier as AsyncComponent)();
      // If it's a promise, resolve it
      let resolved = await Promise.resolve(called);

      // If the promise resolved directly to an element,
      // return it
      // otherwise, assume that it resolved to a module
      // with the default export being the element
      if ((resolved as Module).default) {
        return (resolved as Module).default;
      } else {
        return resolved as HTMLElement;
      }
    } else {
      // If it's not a string or a promise,
      // it's just
      return identifier as HTMLElement;
    }
  }

  constructor(record: Record) {
    let {
      path,
      component,
      exact,
      redirect,
      slot,
      guard,
      properties,
      children
    } = record;

    // Path should be exact if the route
    // does not have any children,
    // but only if the record does not
    // declare anything
    if (exact == null) {
      exact = (
        children == null ||
        children.length === 0
      );
    }

    super(path, exact);
    this.path = path;
    this.exact = exact;
    this.redirect = redirect;
    this.component = component;
    this.slot = slot;
    this.guard = guard || always;
    this.properties = freeze(properties || empty);
    this.children = (children || []).map(child =>
      createChildRoute(clone(child), this)
    );
  }

  async import(): Promise<HTMLElement> {
    if (Route.cache.has(this.component)) {
      return Route.cache.get(this.component);
    } else {
      let ctor = await Route.import(this.component);
      Route.cache.set(this.component, ctor);
      return ctor;
    }
  }

  snapshot(identifier: string | Location): Snapshot {
    let uri;
    if (typeof identifier === 'string') {
      uri = split(identifier);
    } else {
      uri = identifier;
    }

    return freeze({
      parameters: this.parse(decode(uri.pathname)),
      query: Query.parse(decode(uri.search)),
      matched: this.matched(decode(uri.pathname)),
      hash: uri.hash
    });
  }
}

function createChildRoute(record: Record, parent: Route): Route {
  if (record.path === '') {
    // If the path is empty, simply copy the parent path
    record.path = parent.path;
  } else {
    // Otherwise, prepend the parent path
    record.path = normalize(parent.path + '/' + record.path);
  }

  // Same idea with redirect
  if (record.redirect != null) {
    if (record.redirect === '') {
      record.redirect = parent.path;
    } else {
      record.redirect = normalize(parent.path + '/' + record.redirect);
    }
  }

  return new Route(record);
}

export default Route;