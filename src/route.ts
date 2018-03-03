import { Path, Parameters } from './path';
import { Query } from './query';
import {
  normalize,
  clone,
  freeze,
  always,
  isFunction
} from './utils';

export interface Module {
  default: HTMLElement;
}

export type Component = AsyncComponent | HTMLElement | string;
export type AsyncComponent = () => Promise<HTMLElement | Module>;
export type Guard = () => boolean;

export interface Record {
  path: string;
  component: Component;
  exact?: boolean;
  redirect?: string;
  slot?: string;
  guard?: Guard;
  meta?: { [key: string]: any };
  properties?: { [key: string]: any };
  children?: Record[];
}

export interface Snapshot {
  readonly parameters: Parameters;
  readonly query: Query;
  readonly matched: string;
  readonly hash: string;
}

export class Route extends Path {
  path: string;
  component: Component;
  exact: boolean;
  children: Route[];
  guard: Guard;
  meta: any;
  properties: any;
  redirect?: string;
  slot?: string;
  private resolved?: HTMLElement;

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
      let resolved: any = await Promise.resolve(called);

      // If the promise resolved directly to an element,
      // return it
      // otherwise, assume that it resolved to a module
      // with the default export being the element
      if (resolved.default) {
        return resolved.default;
      } else {
        return resolved;
      }
    } else {
      // If it's not a string or a promise,
      // it's just
      return identifier as HTMLElement;
    }
  }

  constructor(record: Record) {
    super(record.path, record.exact);
    this.path = record.path;
    this.exact = record.exact === true;
    this.redirect = record.redirect;
    this.component = record.component;
    this.slot = record.slot;
    this.guard = record.guard || always;
    this.meta = freeze(record.meta || {});
    this.properties = freeze(record.properties || {});
    this.children = (record.children || []).map(child =>
      createChildRoute(clone(child), this)
    );
  }

  async import(): Promise<HTMLElement> {
    if (this.resolved == null) {
      this.resolved = await Route.import(this.component);
    }
    return this.resolved;
  }

  snapshot(path: string): Snapshot {
    return freeze({
      parameters: this.parse(path),
      query: Query.parse(location.search),
      matched: this.matched(path),
      hash: location.hash.substring(1)
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
    if (record.redirect === '') {
      record.redirect = parent.path;
    } else {
      record.redirect = normalize(parent.path + '/' + record.redirect);
    }
  }

  if (record.children == null) {
    record.exact = true;
  }

  return new Route(record);
}
