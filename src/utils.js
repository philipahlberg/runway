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
 * @returns {boolean}
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
  // First it is determined if it's an async or generator function.
  // Generator functions and classes have the same properties,
  // so using the tag is needed.
  // An async function can also be identified with this method, so it
  // is also done here for convenience.
  // Ordinary functions, arrow functions and classes cannot be identified
  // with this method.
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

const components = new WeakMap();

/**
 * Resolve an identifier to a class.
 * @param {Promise|Function|String} component The identifier
 * @param {Function} callback
 */
export function load(component, callback) {
  if (typeof component === 'string') {
    // If it's a string, assume that it has
    // been defined, and return the class
    // associated with the tag to allow
    // uniform callback function signature.
    callback(customelements.get(component));

  } else if (components.has(component)) {
    // If it has been resolved before,
    // return the resolved value.
    callback(components.get(component));

  } else if (isFunction(component)) {
    // If it's a function, call it.
    let called = component();
    if (isPromise(called)) {
      // If the function returns a promise,
      // assume that it is a module and assume
      // the component is the default export.
      called.then((m) => {
        components.set(component, m.default);
        callback(m.default);
      });
    } else {
      // If the function call returned something
      // that isn't a promise, assume that it returned
      // a component directly.
      components.set(component, called);
      callback(called);
    }
  } else {
    callback(component);
  }
}
