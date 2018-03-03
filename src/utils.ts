/**
 * Append a leading slash, and remove all excess slashes.
 */
export function normalize(path: string): string {
  return ('/' + path).replace(/[\/]+/g, '/');
}

/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
 * @param object the object that is to be inspected
 * @returns `true` if the given object is a callable function
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

export function clone<T>(object: T): T {
  return Object.assign({}, object);
}

export function freeze(object: any) {
  return Object.freeze(object);
}

export function always(): true {
  return true;
}

export function never(): false {
  return false;
}

export const EMPTY = freeze(Object.create(null));
