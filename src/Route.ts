import { parse, compile, execute, map } from '@philipahlberg/expressionist';
import { Query } from './Query';
import { join, decode } from './utils';
import {
  Component,
  GuardFn,
  PropertiesFn,
  Record,
  Snapshot,
  Module,
  CustomElement
} from './types';

export class Route {
  private static cache = new WeakMap<any, CustomElement>();
  private keys: string[];
  private pattern: RegExp;
  path: string;
  exact: boolean;
  component: Component;
  redirect?: string;
  slot?: string;
  guard: GuardFn;
  properties: PropertiesFn;
  children: Route[];

  constructor(record: Record) {
    let { path, component, exact,
      redirect, slot, guard,
      properties, children } = record;

    // Path should be exact if the route
    // does not have any children,
    // but only if the record does not
    // specify anything
    if (exact == null) {
      exact = children == null ||
        children.length === 0;
    }

    this.keys = parse(path);
    this.pattern = compile(path, exact);
    this.path = path;
    this.exact = exact;
    this.redirect = redirect;
    this.component = typeof component === 'string'
      ? customElements.get(component)
      : component;
    this.slot = slot;
    this.guard = guard || (() => true);
    this.properties = properties || (() => ({}));
    this.children = (children || []).map(child =>
      createChildRoute(child, this)
    );
  }

  async import(): Promise<CustomElement> {
    const cache = Route.cache;
    const component = this.component;

    if (isHTMLElement(component)) {
      return component;
    } else if (cache.has(component)) {
      return cache.get(component)!;
    } else {
      const res = await (this.component as () => Module)();
      const ctor = res.default as CustomElement;
      cache.set(component, ctor);
      return ctor;
    }
  }

  snapshot(source: Location | URL): Snapshot {
    let { pathname, search, hash } = source;
    pathname = decode(pathname);
    search = decode(search);
    return {
      parameters: this.map(pathname),
      query: Query.parse(search),
      matched: this.matched(pathname),
      hash: hash.substring(1)
    };
  }

  transfer(source: string, target: string): string {
    const values = execute(this.pattern, source);
    let i = values.length;
    while (i--) {
      target = target
        .replace(':' + this.keys[i], values[i]);
    }

    return target;
  }

  matches(path: string): boolean {
    return this.pattern.test(path);
  }

  matched(path: string): string {
    const matched = this.pattern.exec(path);
    return matched && matched[0] || '';
  }

  map(path: string): Map<string, string> {
    const values = execute(this.pattern, path);
    return map(this.keys, values);
  }
}

function createChildRoute(record: Record, parent: Route): Route {
  if (record.path === '') {
    record.path = parent.path;
  } else {
    record.path = join(parent.path, record.path);
  }
  if (record.redirect != null) {
    record.redirect = join(parent.path, record.redirect);
  }
  return new Route(record);
}

function isHTMLElement(o: any): o is CustomElement {
  return HTMLElement.isPrototypeOf(o);
}