const MATCH_ALL = '[^/]*';

const CATCH_ALL = '([^/]+)';

const PARAMETER_PATTERN = /:([^\/]+)/;

// optional trailing slash
// only matches the slash if nothing follows
const MATCH_TRAILING_SLASH = '(?:[\/]?(?=$))?';

// implements '**' as a wildcard
const WILDCARD_PATTERN = /\*\*/g;

export class Path {
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

export default Path;