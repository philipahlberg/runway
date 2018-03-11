import { pathname, zip, dict } from './utils';

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

  constructor(path: string = '', exact: boolean = false) {
    path = pathname(path);
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
      // match[0] is the entire declaration, e. g. ':param'
      temporary = temporary.replace(match[0], CATCH_ALL);
      // match[1] is the name of the parameter, e. g. 'param'
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
    return this.pattern.test(pathname(path));
  }

  /**
   * Find the matched part of the given path.
   */
  matched(path: string): string {
    let matched = this.pattern.exec(pathname(path));
    return matched && matched[0] || '';
  }

  /**
   * Parse a path string for parameter values.
   */
  parse(path: string): Parameters {
    return new Parameters(
      path,
      this.pattern,
      this.keys
    );
  }

  /**
   * Transfer matched parameters in the given url to
   * the target path, filling in named parameters in if they exist.
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

export default Path;

export class Parameters extends Map<string, string> {
  path: string;

  constructor(path: string, pattern: RegExp, keys: string[]) {
    path = pathname(path);
    const values = (pattern.exec(path) || []).slice(1);
    super(zip(keys, values));
    this.path = path;
  }

  all(): Dictionary<string> {
    return dict(Array.from(this.entries()));
  }
}
