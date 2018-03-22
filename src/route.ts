import Path, { Parameters } from './path';
import Query from './query';
import {
  normalize,
  decode,
  split,
  freeze,
  always,
  empty,
  isFunction,
  isModule
} from './utils';

interface Module {
  default: HTMLElement;
}

type Component = AsyncComponent | HTMLElement | string;
type AsyncComponent = () => Promise<HTMLElement | Module>;
type Guard = () => boolean;
type Properties = (snapshot: Snapshot) => Dictionary<any>;

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

interface Snapshot {
  readonly parameters: Parameters;
  readonly query: Query;
  readonly hash: string;
  readonly matched: string;
}

export class Route extends Path {
  static cache = new Map();
  path: string;
  exact: boolean;
  component: Component;
  redirect?: string;
  slot?: string;
  guard: Guard;
  properties: Properties;
  children: Route[];

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
      // If it's not a string or a function,
      // assume it's just a constructor
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
    this.component = component;
    this.slot = slot;
    this.guard = guard || always;
    this.properties = properties || empty;
    this.children = (children || []).map(child =>
      createChildRoute(child, this)
    );
    freeze(this);
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
    let location;
    if (typeof identifier === 'string') {
      location = split(identifier);
    } else {
      location = identifier;
    }

    return freeze({
      parameters: this.parse(decode(location.pathname)),
      query: Query.parse(decode(location.search)),
      matched: this.matched(decode(location.pathname)),
      hash: location.hash
    });
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