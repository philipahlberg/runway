export interface ModuleDescriptor {
  default: any;
  [key: string]: any;
}

export type Tuple<T> = [T, T];
export type Dictionary<T> = { [key: string]: T };
export type ComponentFn = () => Promise<HTMLElement | ModuleDescriptor>;
export type Component = HTMLElement | ComponentFn;
export type GuardFn = () => boolean;
export type PropertiesFn = (snapshot: Snapshot) => Dictionary<any>;

export interface Record {
  path: string;
  component?: Component | string;
  exact?: boolean;
  redirect?: string;
  slot?: string;
  guard?: GuardFn;
  properties?: PropertiesFn;
  children?: Record[];
}

export interface Snapshot {
  parameters: Map<string, string>;
  query: Map<string, string>;
  hash: string;
  matched: string;
}

export interface Constructor<T> {
  new (...args: any[]): T;
}

export interface NavigationOptions {
  data: any;
  title: string;
}

export type PopstateListener = (to: string) => void;

export type EventEmitterListener = (detail?: any) => void;

export type URI = { pathname: string, search: string, hash: string };