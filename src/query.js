export class Query extends Map {
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