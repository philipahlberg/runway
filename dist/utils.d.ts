import { ModuleDescriptor } from './types';
/**
 * Append a leading slash, and remove all excess slashes.
 */
export declare function normalize(path: string): string;
/**
 * Shorthand for `decodeURIComponent`
 */
export declare function decode(str: string): string;
export declare function isFunction(object: any): object is Function;
export declare function isGeneratorFunction(object: any): object is GeneratorFunction;
export declare function isAsyncFunction(object: any): boolean;
export declare function isArrowFunction(object: any): boolean;
export interface Constructor<T> {
    new (...args: any[]): T;
}
export declare function isConstructible(object: any): object is Constructor<any>;
/**
 * Determine if the given object is a Promise.
 */
export declare function isPromise(object: any): boolean;
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
export declare function isModule(object: any): object is PromiseLike<ModuleDescriptor>;
/**
 * Shorthand for `Object.assign`.
 */
export declare function clone<T>(object: T): T;
/**
 * Shorthand for `Object.freeze`.
 */
export declare function freeze<T>(object: T): T;
/**
 * Shorthand for `Object.create(null)`.
 */
export declare function empty(): any;
/**
 * A frozen object with no prototype chain.
 */
export declare const EMPTY: any;
