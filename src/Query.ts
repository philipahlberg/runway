export class Query extends Map<string, string> {
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