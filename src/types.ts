import { Route } from './Route';

export interface ModuleDescriptor {
    default: Component;
}

export type Module = PromiseLike<ModuleDescriptor>;

export interface Dictionary<T> { [key: string]: T }

export interface Constructor<T> {
    new (): T;
}

export type Component = Constructor<HTMLElement>;

export type LoadFn = () => Module;

export type GuardFn = () => boolean;

export type PropertiesFn = (snapshot: Snapshot) => {};

export interface RedirectOptions {
    path: string;
    exact?: boolean;
    guard?: GuardFn;
    redirect: string;
}

export interface ComponentOptions {
    path: string;
    exact?: boolean;
    guard?: GuardFn;
    component?: Component;
    load?: LoadFn;
    slot?: string;
    properties?: PropertiesFn;
    children?: RouteOptions[];
}

export type RouteOptions = ComponentOptions | RedirectOptions;

export interface Snapshot {
    parameters: Map<string, string>;
    query: URLSearchParams;
    hash: string;
    matched: string;
}

export interface SearchResult {
    routes: Route[];
    path: string;
}