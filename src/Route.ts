import { parse, compile, execute, map } from '@philipahlberg/expressionist';
import { Query } from './Query';
import { join, decode } from './utils';
import {
  RouteOptions,
  RedirectOptions,
  // RenderOptions,
  Component,
  GuardFn,
  PropertiesFn,
  LoadFn,
  Snapshot
} from './types';

function createLoadFn(component: Component): LoadFn {
  return () => Promise.resolve({ default: component });
}

function isRedirect(options: RouteOptions): options is RedirectOptions {
  return options.hasOwnProperty('redirect');
}

// function isRender(options: RouteOptions): options is RenderOptions {
//   return options.hasOwnProperty('component') ||
//     options.hasOwnProperty('load');
// }

export class Route {
  private static cache = new WeakMap<Route, Component>();
  private keys: string[];
  private pattern: RegExp;
  path: string;
  exact: boolean;
  guard: GuardFn;
  redirect?: string;
  component?: Component;
  load?: LoadFn;
  properties?: PropertiesFn;
  slot?: string;
  children?: Route[];

  constructor(options: RouteOptions) {
    this.path = options.path;
    this.guard = options.guard || (() => true);
    this.keys = parse(options.path);

    if (isRedirect(options)) {
      this.exact = !!options.exact;
      this.redirect = options.redirect;
    } else {
      this.exact = options.exact != null
        ? options.exact
        : options.children == null;

      this.slot = options.slot;

      if (options.load != null) {
        this.load = options.load;
      } else {
        this.load = createLoadFn(options.component!);
        this.component = options.component;
      }

      this.children = (options.children || [])
        .map(child => createChildRoute(child, this));

      this.properties = options.properties || (() => ({}));
    }

    this.pattern = compile(this.path, this.exact);
  }

  async import(): Promise<Component> {
    const cache = Route.cache;
    let component = cache.get(this);
    if (component === undefined) {
      const module = await (this.load!)();
      component = module.default;
      cache.set(this, component);
      return component;
    }
    return component;
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

function createChildRoute(options: RouteOptions, parent: Route): Route {
  if (options.path === '') {
    options.path = parent.path;
  } else {
    options.path = join(parent.path, options.path);
  }
  if (isRedirect(options)) {
    options.redirect = join(parent.path, options.redirect);
  }
  return new Route(options);
}