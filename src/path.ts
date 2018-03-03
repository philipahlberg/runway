const MATCH_ALL = '[^/]*';

const CATCH_ALL = '([^/]+)';

const PARAMETER_PATTERN = /:([^\/]+)/;

// optional trailing slash
// only matches the slash if nothing follows
const MATCH_TRAILING_SLASH = '(?:[\/]?(?=$))?';

// implements '**' as a wildcard
const WILDCARD_PATTERN = /\*\*/g;

export class Path {
  path: string;
  exact: boolean;
  pattern: RegExp;
  keys: string[];

  /**
   * 
   * @param input The path to compile
   * @param exact Whether or not the pattern should match anything after the path
   */
  constructor(path: string = '', exact: boolean = false) {
    this.path = path;
    this.exact = exact;
    // replace any wildcards with
    // their corresponding expression
    let temporary = path.replace(WILDCARD_PATTERN, MATCH_ALL);
    
    let match: RegExpExecArray | null;
    let keys: string[] = [];
    // convert :param to a catch-all group
    // and save the keys
    while ((match = PARAMETER_PATTERN.exec(temporary)) != null) {
      temporary = temporary.replace(match[0], CATCH_ALL);
      keys.push(match[1]);
    }
    
    if (!temporary.endsWith('/')) {
      temporary += MATCH_TRAILING_SLASH;
    }
    
    temporary = exact ? `^${temporary}$` : `^${temporary}`;
    const pattern = new RegExp(temporary, 'i');

    this.keys = keys;
    this.pattern = pattern;
  }

  /**
   * Convenience function that mirrors RegExp.test
   */
  matches(path: string): boolean {
    return this.pattern.test(path);
  }

  /**
   * Find the matched part of the given path.
   */
  matched(path: string): string {
    let matched = this.pattern.exec(path);
    return matched && matched[0] || '';
  }

  /**
   * Parse a path string for parameter values.
   */
  parse(path: string) {
    return new Parameters(
      path,
      this.pattern,
      this.keys
    );
  }

  /**
   * Transfer matched parameters in the given url to
   * the target path, filling in named parameters in if they exist.
   * @param {String} from a matched url
   * @param {String} to a path
   * @return {String} The target path with parameters filled in
   */
  transfer(from: string, to: string): string {
    const values = (this.pattern.exec(from) || []).slice(1);
    let transferred = to;
    let i = values.length;
    while (i--) {
      transferred = transferred
        .replace(':' + this.keys[i], values[i]);
    }

    return transferred;
  }
}

export type StringDictionary = { [key: string]: string };
export type StringTuple = [string, string];

export class Parameters {
  path: string;
  keys: string[];
  values: string[];

  constructor(path: string, pattern: RegExp, keys: string[]) {
    this.path = path;
    this.keys = keys;
    this.values = (pattern.exec(path) || []).slice(1);
  }

  get(key: string): string {
    return this.values[this.keys.indexOf(key)];
  }

  set(key: string, value: string): string {
    return this.path.replace(this.get(key), value);
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  entries(): StringTuple[] {
    let entries: StringTuple[] = [];
    for (let i = 0; i < this.keys.length; i++) {
      entries.push([this.keys[i], this.values[i]]);
    }
    return entries;
  }

  all(): StringDictionary {
    return this.keys.reduce((object: StringDictionary, key: string, i) => {
      object[key] = this.values[i];
      return object;
    }, {});
  }

  *[Symbol.iterator]() {
    const length = this.keys.length;
    for (let i = 0; i < length; i++) {
      yield [this.keys[i], this.values[i]];
    }
  }
}

export default Path;