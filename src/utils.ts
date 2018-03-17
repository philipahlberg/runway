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

type URI = { pathname: string, search: string, hash: string };

/**
 * Split the pathname, search (query) and hash of a path.
 */
export function split(path: string): URI {
  let temp = path.split('#');
  const hash = temp[1] || '';
  temp = (temp[0] || '').split('?');
  const search = temp[1] || '';
  const pathname = temp[0] || '';
  return {
    pathname,
    search,
    hash
  };
}

/**
 * Extract the pathname of a path (i. e. excluding the search and hash).
 */
export function pathname(path: string): string {
  return (path.split('#')[0] || '').split('?')[0];
}

/**
 * Extract the search (query) of a path.
 */
export function search(path: string): string {
  path = (path.split('#')[0] || '');
  if (/\?/.test(path)) {
    return path.split('?')[1] || '';
  } else {
    return path;
  }
}

/**
 * Extract the hash of a path.
 */
export function hash(path: string): string {
  return path.split('#')[1] || '';
}

/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
 */
export function isFunction(object: any): boolean {
  if (!(typeof object === 'function')) {
    return false;
  }

  /**
   * Values for `hasOwnProperty` on functions:
   * 
   *           | Class | Ordinary | Arrow | Async | Generator |
   * ---------------------------------------------------------|
   * arguments | false |   true   | false | false |   false   |
   * prototype | true  |   true   | false | false |   true    |
   * 
   */

  const tag = object[Symbol.toStringTag];
  if (tag === 'AsyncFunction' || tag === 'GeneratorFunction') {
    return true;
  } else {
    // Ordinary functions have an `arguments` property, which classes do not.
    const isNormalFunction = object.hasOwnProperty('arguments');
    // Arrow functions do not have a `prototype` property, which classes do.
    const isArrowFunction = !object.hasOwnProperty('prototype');
    return isNormalFunction || isArrowFunction;
  }
}

/**
 * Determine if the given object is a promise.
 */
export function isPromise(object: any): boolean {
  return object[Symbol.toStringTag] === 'Promise';
}

/**
 * Determine if the given object is an ES module (the return value of `import()`)
 * or a shim (like `require()`)
 */
export function isModule(object: any): boolean {
  return object[Symbol.toStringTag] === 'Module' || object.__esModule;
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
 * Always returns `true`.
 */
export function always(): true {
  return true;
}

/**
 * Always returns `false`.
 */
export function never(): false {
  return false;
}

/**
 * Combine two arrays to an array of tuples.
 */
export function zip(a: any[], b: any[]): any[2][] {
  return a.map((v, i) => [v, b[i]]);
}

/**
 * Convert an array of tuples to an object in which each key
 * is the first element of the tuple and the value is the second element of the tuple.
 */
export function dictionary(pairs: [any, any][]): Dictionary<string> {
  let index = -1;
  const length = pairs.length;
  const result: Dictionary<string> = {};

  while (++index < length) {
    const pair = pairs[index];
    result[pair[0]] = pair[1];
  }

  return result;
}

/**
 * A frozen object with no prototype chain.
 */
export const EMPTY = freeze(Object.create(null));
