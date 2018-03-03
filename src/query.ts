export interface StringKeyedObject {
  [key: string]: string;
}

export type StringTuple = [string, string];

export interface Query {
  new(entries: Array<any[]>): Query;
}

export class Query extends Map<string, string> {
  static from(object: StringKeyedObject): Query {
    return new Query(Object.entries(object));
  }

  static of(...pairs: StringTuple[]): Query {
    return new Query(pairs);
  }

  static parse(string: string): Query {
    if (string.startsWith('?')) {
      string = string.substring(1);
    }

    let entries: StringTuple[] = [];
    if (string !== '') {
      entries = string.split('&')
        .map((substring) => (substring.split('=') as StringTuple));
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