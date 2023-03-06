import { parse, compile, execute, toMap } from 'trailblazer';
import { join, decode } from './utils';
import {
  RouteOptions,
  RedirectOptions,
  Component,
  GuardFn,
  PropertiesFn,
  LoadFn,
  Snapshot,
} from './types';

function createLoadFn(component: Component): LoadFn {
  return () => Promise.resolve(component);
}

function isRedirect(options: RouteOptions): options is RedirectOptions {
  return Object.getOwnPropertyNames(options).includes('redirect');
}

const defaultGuardFn = Object.seal(() => true);

const defaultPropertiesFn = Object.seal(() => ({}));

export class Route {
  private static cache = new WeakMap<Route, Component>();
  private keys: string[];
  private pattern: RegExp;
  public path: string;
  public exact: boolean;
  public guard: GuardFn;
  public redirect?: string;
  public component?: Component;
  public load?: LoadFn;
  public properties?: PropertiesFn;
  public slot?: string;
  public children?: Route[];

  public static createPrefixedRoute(options: RouteOptions, prefix: string): Route {
    if (options.path === '') {
      options.path = prefix;
    } else {
      options.path = join(prefix, options.path);
    }
    if (isRedirect(options)) {
      options.redirect = join(prefix, options.redirect);
    }
    return new Route(options);
  }

  public constructor(options: RouteOptions) {
    this.path = options.path;
    this.guard = options.guard || defaultGuardFn;
    this.keys = parse(options.path);

    if (isRedirect(options)) {
      this.exact = true;
      this.redirect = options.redirect;
    } else {
      this.exact =
        options.exact != null ? options.exact : options.children == null;

      this.slot = options.slot;

      if (options.load != null) {
        this.load = options.load;
      } else if (options.component != null) {
        this.load = createLoadFn(options.component);
        this.component = options.component;
      } else {
        throw new Error('Either `load` or `component` must be provided.');
      }

      this.children = (options.children || []).map(
        (child): Route => Route.createPrefixedRoute(child, this.path)
      );

      this.properties = options.properties || defaultPropertiesFn;
    }

    this.pattern = compile(this.path, this.exact);
  }

  public async import(): Promise<Component> {
    const cache = Route.cache;
    let component = cache.get(this);
    if (component == null) {
      if (this.load == null) {
        throw new Error('Missing `load` function.');
      }
      component = await this.load();
      cache.set(this, component);
    }
    return component;
  }

  public snapshot(source: Location | URL): Snapshot {
    const pathname = decode(source.pathname);
    const search = decode(source.search);
    const hash = source.hash;
    return {
      parameters: this.map(pathname),
      query: new URLSearchParams(search),
      matched: this.matched(pathname),
      hash: hash.substring(1),
    };
  }

  public transfer(source: string, target: string): string {
    const values = execute(this.pattern, source);
    let i = values.length;
    while (i--) {
      target = target.replace(':' + this.keys[i], values[i]);
    }

    return target;
  }

  public matches(path: string): boolean {
    return this.pattern.test(path);
  }

  public matched(path: string): string {
    const matched = this.pattern.exec(path);
    return (matched && matched[0]) || '';
  }

  public map(path: string): Map<string, string> {
    const values = execute(this.pattern, path);
    return toMap(this.keys, values);
  }
}
