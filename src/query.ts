export class Query extends Map<string, string> {
  static from(object: Dictionary<string>): Query {
    return new Query(Object.entries(object));
  }

  static parse(string: string): Query {
    if (/\?/.test(string)) {
      string = string.replace(/^.*\?/, '');
    }
    if (/#/.test(string)) {
      string = string.replace(/#.*$/, '');
    }

    let entries: [string, string][] = [];
    if (string !== '') {
      entries = string.split('&')
        .map((substring) => (substring.split('=') as [string, string]));
    }

    return new Query(entries);
  }

  toString(): string {
    return Array.from(this.entries())
      .map(entry => entry.join('='))
      .join('&');
  }
}

export default Query;
