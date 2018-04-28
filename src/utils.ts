import { ModuleDescriptor } from './types';

/**
 * Append a leading slash, and remove all excess slashes.
 */
export function normalize(path: string): string {
  return ('/' + path).replace(/[\/]+/g, '/');
}

/**
 * Shorthand for `decodeURIComponent`
 */
export function decode(str: string): string {
  return decodeURIComponent(str);
}

/**
 * Determine if the given object is a Promise.
 */
export function isPromise(object: any): boolean {
  return object[Symbol.toStringTag] === 'Promise';
}

/**
 * Determine if the given object is an ES module (the return value of `import()`)
 * or a shim (like `require()`)
 * @example
 * isModule(import('./module.js')); // => true
 * // Using `await` means it won't register as a module:
 * isModule(await import('./module.js')); // => false
 * 
 * @param object The object to inspect
 */
export function isModule(object: any): object is PromiseLike<ModuleDescriptor> {
  return object[Symbol.toStringTag] === 'Module' || object.__esModule === true;
}

/**
 * Shorthand for `Object.assign`.
 */
export function clone<T>(object: T): T {
  return Object.assign(empty(), object);
}

/**
 * Shorthand for `Object.freeze`.
 */
export function freeze<T>(object: T): T {
  return Object.freeze(object);
}

/**
 * Shorthand for `Object.create(null)`.
 */
export function empty() {
  return Object.create(null);
}

/**
 * A frozen object with no prototype chain.
 */
export const EMPTY = freeze(Object.create(null));
