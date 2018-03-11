/**
 * Append a leading slash, and remove all excess slashes.
 */
export function normalize(path: string): string {
  return ('/' + path).replace(/[\/]+/g, '/');
}

export function decode(str: string): string {
  return decodeURIComponent(str);
}

type URI = { pathname: string, search: string, hash: string };

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

export function pathname(path: string): string {
  return (path.split('#')[0] || '').split('?')[0];
}

export function search(path: string): string {
  path = (path.split('#')[0] || '');
  if (/\?/.test(path)) {
    return path.split('?')[1] || '';
  } else {
    return path;
  }
}

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

export function isPromise(object: any): boolean {
  return object[Symbol.toStringTag] === 'Promise';
}

export function isModule(object: any): boolean {
  return object[Symbol.toStringTag] === 'Module';
}

export function clone<T>(object: T): T {
  return Object.assign({}, object);
}

export function freeze<T>(object: T): T {
  return Object.freeze(object);
}

export function empty() {
  return Object.create(null);
}

export function always(): true {
  return true;
}

export function never(): false {
  return false;
}

export function zip(a: any[], b: any[]): any[] {
  return a.map((v, i) => [v, b[i]]);
}

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

export const EMPTY = freeze(Object.create(null));
