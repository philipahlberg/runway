import { search, dictionary } from './utils';

export class Query extends Map<string, string> {
  static from(object: Dictionary<string>): Query {
    return new Query(Object.entries(object));
  }

  static parse(string: string): Query {
    const queryString = search(string);

    let entries: Tuple<string>[] = [];
    if (queryString !== '') {
      entries = queryString.split('&')
        .map((substring) => (substring.split('=') as Tuple<string>));
    }

    return new Query(entries);
  }

  all(): Dictionary<string> {
    return dictionary(Array.from(this.entries()));
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
