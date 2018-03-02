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
  constructor(path = '', exact = false) {
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
   * Find the matched part of the given path.
   * @param {String} path path to match against
   * @return {String} matched portion of the path 
   */
  matched(path) {
    let matched = this.pattern.exec(path);
    return matched && matched[0] || '';
  }

  /**
   * Parse a path string for parameter values.
   * @param {String} path the path to get values from
   * @return {ParsedExpression}
   */
  parse(path) {
    return new ParsedExpression(
      path,
      this.pattern,
      this.keys
    );
  }

  /**
   * Transfer matched parameters in the given url to
   * the target path, filling in named parameters in if they exist.
   * @param {String} current a matched url
   * @param {String} target a path
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
    this.url = url;
    this.keys = keys;
    this.values = pattern.exec(url).slice(1);
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
    return entries;
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

function clone(obj) {
  return Object.assign({}, obj);
}

function freeze(obj) {
  return Object.freeze(obj);
}

function always() {
  return true;
}

const EMPTY = freeze(Object.create(null));

const components = new WeakMap();

/**
 * Resolve an identifier to a constructor.
 * @param {Promise|Function|String} component the identifier
 * @param {Function} callback
 */
function load(component, callback) {
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

class Route extends Path {
  constructor(options) {
    super(options.path, options.exact);
    this.path = options.path;
    this.exact = options.exact === true;
    this.redirect = options.redirect;
    this.component = options.component;
    this.slot = options.slot;
    this.guard = options.guard || always;
    this.meta = freeze(options.meta || {});
    this.properties = freeze(options.properties || {});
    this.children = (options.children || []).map(record =>
      createChildRoute(clone(record), this)
    );
  }

  async import() {
    return new Promise(resolve => {
      load(this.component, Component => resolve(Component));
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

class ActivatedRoute {
  constructor(route, url) {
    this.parameters = route.parse(url);
    this.matched = route.matched(url);
    this.query = Query.parse(url);
    this.hash = location.hash.substring(1);
  }
}

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
    const path = decodeURIComponent(location.pathname);
    const { matched, url } = this.match(path);
    history.replaceState(null, null, url);
    return this.render(matched);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
    this.teardown();
    this.matched = [];
    this.target = null;
  }

  onPopstate() {
    const path = decodeURIComponent(location.pathname);
    const { matched } = this.match(path);
    this.render(matched);
  }

  push(url, { data, title } = EMPTY) {
    url = decodeURIComponent(url);
    const { matched, path } = this.match(url);
    history.pushState(data, title, path);
    return this.render(matched);
  }

  replace(url, { data, title } = EMPTY) {
    url = decodeURIComponent(url);
    const { matched, path } = this.match(url);
    history.replaceState(data, title, path);
    return this.render(matched);
  }

  match(path) {
    const search = (routes, matched) => {
      // Find a starting match
      const route = routes
        .find(r => r.matches(path) || r.guard());

      if (route) {
        matched.push(route);
        if (route.redirect != null) {
          // transfer any matched parameters
          const matched = route.matched(path);
          const redirected = route.transfer(matched, route.redirect);
          // and start over
          return this.match(redirected);
        } else if (route.children) {
          // Search through the children
          return search(route.children, matched);
        } else {
          return { matched, path };
        }
      } else {
        // End the search here
        return { matched, path };
      }
    };

    return search(this.routes, []);
  }

  async render(matched) {
    // Importing early in case both network
    // and device is slow, but not awaiting
    // it just yet.
    const load$$1 = Promise.all(
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
    while (removals.length > 0) {
      const element = removals.pop();
      element.remove();
    }

    this.views = this.views.slice(0, start);

    const components = await load$$1;
    // Create the new elements
    const additions = components.slice(start)
      .map(Component => new Component());

    // Combine the newly created elements in order
    // while being careful not to render them yet
    for (let i = 0; i < additions.length - 1; i++) {
      const parent = additions[i];
      const child = additions[i + 1];
      parent.append(child);
    }

    this.views = this.views.concat(additions);

    // In correct order, resolve any new properties
    // Note: this happens before the new elements are connected
    const url = decodeURIComponent(location.pathname);
    for (let i = 0; i < this.views.length; i++) {
      const view = this.views[i];
      const route = matched[i];
      const Component = components[i];

      const active = new ActivatedRoute(route, url);

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

  teardown() {
    while (this.views.length > 0) {
      const view = this.views.pop();
      view.remove();
    }
  }
}

export default Router;
export { Path, Query, Route };
