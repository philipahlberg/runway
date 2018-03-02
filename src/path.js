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

export default Path;