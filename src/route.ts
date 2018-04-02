import Path, { Parameters } from './path';
import Query from './query';
import {
  normalize,
  decode,
  split,
  always,
  empty,
  isFunction,
  isModule
} from './utils';

interface Module {
  default: HTMLElement;
}

type Component = AsyncComponent | HTMLElement;
type AsyncComponent = () => Promise<HTMLElement | Module>;
type Guard = () => boolean;
type Properties = (snapshot: Snapshot) => Dictionary<any>;

export interface Record {
  path: string;
  component?: Component | string;
  exact?: boolean;
  redirect?: string;
  slot?: string;
  guard?: Guard;
  properties?: Properties;
  children?: Record[];
}

interface Snapshot {
  parameters: Parameters;
  query: Query;
  hash: string;
  matched: string;
}

export class Route extends Path {
  private static cache = new WeakMap();
  path: string;
  exact: boolean;
  component: Component;
  redirect?: string;
  slot?: string;
  guard: Guard;
  properties: Properties;
  children: Route[];

  static async import(identifier: Component): Promise<HTMLElement> {
    if (isFunction(identifier)) {
      // If it's a function, call it
      let called = (identifier as AsyncComponent)();
      // If it's a promise, resolve it
      let resolved = await Promise.resolve(called);
      // If the promise resolved to a module, assume
      // the constructor is the default export
      // Otherwise, assume the promise resolved
      // to a constructor
      if (isModule(resolved)) {
        return (resolved as Module).default;
      } else {
        return resolved as HTMLElement;
      }
    } else {
      // If it's not a function,
      // assume it's a constructor
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
    // specifically declare anything
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
    this.component = typeof component === 'string'
      ? customElements.get(component)
      : component;
    this.slot = slot;
    this.guard = guard || always;
    this.properties = properties || empty;
    this.children = (children || []).map(child =>
      createChildRoute(child, this)
    );
  }

  async import(): Promise<HTMLElement> {
    if (!isFunction(this.component)) {
      return this.component as HTMLElement;
    } else if (Route.cache.has(this.component)) {
      return Route.cache.get(this.component);
    } else {
      const ctor = await Route.import(this.component);
      Route.cache.set(this.component, ctor);
      return ctor;
    }
  }

  snapshot(location: string | Location): Snapshot {
    const {
      pathname,
      search,
      hash
    } = typeof location === 'string'
      ? split(location)
      : location;

    return {
      parameters: this.parse(decode(pathname)),
      query: Query.parse(decode(search)),
      matched: this.matched(decode(pathname)),
      hash
    };
  }
}

function createChildRoute(record: Record, parent: Route): Route {
  if (record.path === '') {
    record.path = parent.path;
  } else {
    record.path = normalize(parent.path + '/' + record.path);
  }
  if (record.redirect != null) {
    record.redirect = normalize(parent.path + '/' + record.redirect);
  }
  return new Route(record);
}

export default Route;