import Query from '@philipahlberg/query';
import Path from '@philipahlberg/path';
import { empty, always } from '@philipahlberg/scratchpad';
import { normalize, decode } from './utils';
import {
  Component,
  ComponentFn,
  GuardFn,
  PropertiesFn,
  Record,
  Snapshot
} from './types';

export class Route extends Path {
  private static cache = new WeakMap<any, HTMLElement>();
  path: string;
  exact: boolean;
  component: Component;
  redirect?: string;
  slot?: string;
  guard: GuardFn;
  properties: PropertiesFn;
  children: Route[];

  static async import(component: Component): Promise<HTMLElement> {
    if (typeof component !== 'function') {
      throw new TypeError('Component must be a class or function.');
    }

    if (HTMLElement.isPrototypeOf(component)) {
      return component as HTMLElement;
    } else {
      const called = (component as ComponentFn)();
      const resolved = await Promise.resolve(called);
      if (resolved.default) {
        return resolved.default;
      } else {
        return resolved as HTMLElement;
      }
    }
  }

  constructor(record: Record) {
    let { path, component, exact,
      redirect, slot, guard,
      properties, children } = record;

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
    const cache = Route.cache;
    const component = this.component;

    if (HTMLElement.isPrototypeOf(component)) {
      return component as HTMLElement;
    } else if (cache.has(component)) {
      return cache.get(component)!;
    } else {
      const ctor = await Route.import(component);
      cache.set(component, ctor);
      return ctor;
    }
  }

  snapshot(source: Location | URL): Snapshot {
    const { pathname, search, hash } = source;
    return {
      parameters: this.toMap(decode(pathname)),
      query: Query.parse(decode(search)),
      matched: this.matched(decode(pathname)),
      hash: hash.substring(1)
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
