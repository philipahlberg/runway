const MATCH_ALL = '[^/]*';

const CATCH_ALL = '([^/]+)';

const PARAMETER_PATTERN = /:([^\/]+)/;

// optional trailing slash
// only matches the slash if nothing follows
const MATCH_TRAILING_SLASH = '(?:[\/]?(?=$))?';

// implements '**' as a wildcard
const WILDCARD_PATTERN = /\*\*/g;

class Path {
  /**
   * 
   * @param {String} input The path to compile
   * @param {Boolean} exact Whether or not the pattern should match anything after the path
   */
  constructor(path, exact = false) {
    // replace any wildcards with
    // their corresponding expression
    path = path.replace(WILDCARD_PATTERN, MATCH_ALL);
    
    let match;
    let keys = [];
    // convert :param to a catch-all group
    // and save the keys
    while ((match = PARAMETER_PATTERN.exec(path)) != null) {
      path = path.replace(match[0], CATCH_ALL);
      keys.push(match[1]);
    }

    if (!path.endsWith('/')) {
      path += MATCH_TRAILING_SLASH;
    }

    path = exact ? `^${path}$` : `^${path}`;
    const pattern = new RegExp(path, 'i');

    this.pattern = pattern;
    this.keys = keys;
  }

  /**
   * Convenience function that mirrors RegExp.test
   * @param {String} path
   * @return {Boolean} 
   */
  matches(path) {
    return this.pattern.test(path);
  }

  /**
   * 
   * @param {String} path Path to match against.
   * @return {String} Matched portion of the path. 
   */
  matched(path) {
    return this.pattern.exec(path)[0];
  }

  /**
   * @param {String} url The path to get values from
   * @return {ParsedExpression} A collection of functions for working with the url
   */
  parse(url) {
    return new ParsedExpression(
      url,
      this.pattern,
      this.keys
    );
  }

  /**
   * 
   * @param {String} target A path, potentially with unresolved parameters 
   * @param {String} current The path that was matched
   * @return {String} The target path with parameters filled in
   */
  transfer(current, target) {
    const values = this.pattern.exec(current).slice(1);
    let transferred = target;

    let i = values.length;
    while (i--) {
      transferred = transferred
        .replace(':' + this.keys[i], values[i]);
    }

    return transferred;
  }
}

class ParsedExpression {
  constructor(url, pattern, keys) {
    this.values = pattern.exec(url).slice(1);
    this.url = url;
    this.keys = keys;
    this.map = new Map();
  }

  get(key) {
    return this.values[this.keys.indexOf(key)];
  }

  set(key, value) {
    return this.url.replace(this.get(key), value);
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  all() {
    return this.keys.reduce((object, key, i) => {
      object[key] = this.values[i];
      return object;
    }, {});
  }

  entries() {
    let entries = [];
    for (let i = 0; i < this.keys.length; i++) {
      entries.push([this.keys[i], this.values[i]]);
    }
  }

  *[Symbol.iterator]() {
    const length = this.keys.length;
    for (let i = 0; i < length; i++) {
      yield [this.keys[i], this.values[i]];
    }
  }
}

class Query extends Map {
  static from(object) {
    return new Query(Object.entries(object));
  }

  static of(...pairs) {
    return new Query(pairs);
  }

  static parse(string) {
    if (string.startsWith('?')) {
      string = string.substring(1);
    }

    let entries = [];
    if (string !== '') {
      entries = string.split('&')
        .map((substring) => substring.split('='));
    }

    return new Query(entries);
  }

  toString() {
    let string = '';
    for (const [key, value] of this) {
      string += `&${key}=${value}`;
    }
    return string.substring(1);
  }
}

/**
 * Append a leading slash, and remove all excess slashes.
 * @param {string} path
 * @returns {string}
 */
function normalize(path) {
  return ('/' + path).replace(/[\/]+/g, '/');
}

/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
 * @param {object} object the object that is to be inspected
 * @returns {boolean} if the given object is a callable function
 */
function isFunction(object) {
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

function isPromise(object) {
  return object[Symbol.toStringTag] === 'Promise';
}

const components = new WeakMap();

/**
 * Resolve an identifier to a class.
 * @param {Promise|Function|String} component The identifier
 * @param {Function} callback
 */
function load(component, callback) {
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

const clone = (obj) => Object.assign({}, obj);
const freeze = (obj) => Object.freeze(obj);

class Route extends Path {
  constructor(options) {
    super(options.path, options.exact);
    this.path = options.path;
    this.exact = options.exact === true;
    this.redirect = options.redirect;
    this.component = options.component;
    this.slot = options.slot;
    this.meta = freeze(options.meta || {});
    this.properties = freeze(options.properties || {});
    this.children = (options.children || [])
      .map(record => createChildRoute(clone(record), this));
  }

  async import() {
    return new Promise((resolve) => {
      load(this.component, (Component) => resolve(Component));
    });
  }
}

function createChildRoute(record, parent) {
  if (record.path === '') {
    record.path = parent.path;
  } else {
    record.path = normalize(parent.path + '/' + record.path);
  }

  if (record.redirect != null) {
    if (record.redirect === '') {
      record.redirect = parent.path;
    } else {
      record.redirect = normalize(parent.path + '/' + record.redirect);
    }
  }

  if (record.children == null) {
    record.exact = true;
  }

  return new Route(record);
}

class ActiveRoute {
  constructor(route, url) {
    this.parameters = route.parse(url);
    this.matched = route.matched(url);
    this.query = Query.parse(url);
    this.hash = location.hash.substring(1);
  }
}

const EMPTY = Object.create(null);

class Router {
  constructor(records, target) {
    this.views = [];
    this.matched = [];
    this.routes = records.map(record => new Route(record));
    this.onPopstate = this.onPopstate.bind(this);

    window.Router = this;
    
    if (target) {
      this.connect(target);
    }
  }

  connect(target) {
    this.target = target;
    window.addEventListener('popstate', this.onPopstate);
    const url = decodeURIComponent(location.pathname);
    const { matched } = this.resolve(url);
    return this.render(matched);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
    while (this.views.length > 0) {
      const view = this.views.pop();
      view.remove();
    }
    this.matched = [];
    this.target = null;
  }

  onPopstate() {
    const url = decodeURIComponent(location.pathname);
    const { matched } = this.resolve(url);
    this.render(matched);
  }

  push(path, { data, title } = EMPTY) {
    path = decodeURIComponent(path);
    const { matched, url } = this.resolve(path);
    history.pushState(data, title, url);
    return this.render(matched);
  }

  replace(path, { data, title } = EMPTY) {
    path = decodeURIComponent(path);
    const { matched, url } = this.resolve(path);
    history.replaceState(data, title, url);
    return this.render(matched);
  }

  resolve(url) {
    let matched = [];

    const search = (routes) => {
      // Find a starting match
      const route = routes.find(route => route.matches(url));
      if (route) {
        matched.push(route);
        if (route.redirect) {
          // transfer any matched parameters
          const matched = route.matched(url);
          url = route.transfer(matched, route.redirect);
          // and start over
          return this.resolve(url);
        } else if (route.children) {
          // Search through the children
          return search(route.children);
        } else {
          // End the search here
          return { matched, url };
        }
      } else {
        return { matched, url };
      }
    };

    return search(this.routes);
  }

  async render(matched) {
    // Importing early in case both network
    // and device is slow, but not awaiting
    // it just yet.
    const load = Promise.all(
      matched.map(route => route.import())
    );

    // Find the index at which the matched routes
    // differ from the active routes.
    let start;
    for (let i = 0; i < matched.length; i++) {
      const match = matched[i];
      if (this.matched.length < i + 1) {
        start = i;
        break;
      } else {
        const active = this.matched[i];
        if (match !== active) {
          start = i;
          break;
        }
      }
    }

    if (start == null) {
      start = matched.length;
    }

    this.matched = matched;

    // Remove the obsolete elements
    const removals = this.views.slice(start);
    if (removals.length > 0) {
      removals[0].remove();
    }

    this.views = this.views.slice(0, start);

    const components = await load;
    // Create the new elements
    const additions = components.slice(start)
      .map(Component => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let k = 0; k < additions.length - 1; k++) {
      const parent = additions[k];
      const child = additions[k + 1];
      parent.append(child);
    }

    this.views = this.views.concat(additions);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    const url = decodeURIComponent(location.pathname);
    for (let k = 0; k < this.views.length; k++) {
      const view = this.views[k];
      const route = matched[k];
      const Component = components[k];

      const active = new ActiveRoute(route, url);

      const parameters = active.parameters;
      const options = Component.properties;
      if (options != null) {
        // Resolve parameters from paths
        for (const [key, value] of parameters) {
          if (options.hasOwnProperty(key)) {
            view[key] = value;
          }
        }

        // Resolve additional properties from route
        for (const key in route.properties) {
          if (options.hasOwnProperty(key)) {
            const value = route.properties[key];
            view[key] = value;
          }
        }
      }

      view.route = active;

      if (route.slot) {
        view.setAttribute('slot', route.slot);
      }
    }

    // If there are any additions, they need to be rendered
    if (additions.length > 0) {
      if (start > 0) {
        // Some reuse
        // Connect the new elements to the deepest reused element,
        // implicitly rendering them
        this.views[start - 1].append(additions[0]);
      } else {
        // No reuse
        this.target.append(this.views[0]);
      }
    }
  }
}

export default Router;
