export class Query extends Map<string, string> {
  static from(object: Dictionary): Query {
    return new Query(Object.entries(object));
  }

  static parse(string: string): Query {
    if (string.startsWith('?')) {
      string = string.substring(1);
    }

    let entries: Tuple<string>[] = [];
    if (string !== '') {
      entries = string.split('&')
        .map((substring) => (substring.split('=') as Tuple<string>));
    }

    return new Query(entries);
  }

  toString(): string {
    let string = '';
    for (const [key, value] of this) {
      string += `&${key}=${value}`;
    }
    return string.substring(1);
  }
}

export default Query;
