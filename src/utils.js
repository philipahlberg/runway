/**
 * Append a leading slash, and remove all excess slashes.
 * @param {string} path
 * @returns {string}
 */
export function normalize(path) {
  return ('/' + path).replace(/[\/]+/g, '/');
}

/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
 * @param {object} object the object that is to be inspected
 * @returns {boolean} if the given object is a callable function
 */
export function isFunction(object) {
  if (!(typeof object === 'function')) {
    return false;
  }

  /**
   * Truthiness matrix for `hasOwnProperty` on functions:
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

export function isPromise(object) {
  return object[Symbol.toStringTag] === 'Promise';
}

export function clone(obj) {
  return Object.assign({}, obj);
}

export function freeze(obj) {
  return Object.freeze(obj);
}

export function always() {
  return true;
}

export const EMPTY = freeze(Object.create(null));

const components = new WeakMap();

/**
 * Resolve an identifier to a constructor.
 * @param {Promise|Function|String} component the identifier
 * @param {Function} callback
 */
export function load(component, callback) {
  if (typeof component === 'string') {
    // If it's a string, assume that it has
    // been defined, and return the constructor
    // from the element registry
    callback(customelements.get(component));

  } else if (components.has(component)) {
    // If it has been resolved before,
    // return the resolved value
    callback(components.get(component));

  } else if (isFunction(component)) {
    // If it's a function, call it.
    let called = component();
    if (isPromise(called)) {
      // If the function returns a promise,
      // assume it either resolves to the
      // constructor directly, or to a module
      // wherein the constructor is the default
      // export
      called.then((m) => {
        let ctor = m.default || m;
        components.set(component, ctor);
        callback(ctor);
      });
    } else {
      // If the function call returned something
      // that isn't a promise, assume that it returned
      // a constructor directly
      components.set(component, called);
      callback(called);
    }
  } else {
    callback(component);
  }
}
