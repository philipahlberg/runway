import { Path } from './path.js';
import { Query } from './query.js';
import { load, normalize } from './utils.js';

export class Route extends Path {
  constructor({ path, exact, component, meta, children }) {
    super(path, exact);
    this.path = path;
    this.meta = meta;
    this.component = component;
    this.children = children;
  }

  async import() {
    return new Promise((resolve) => {
      load(this.component, (Component) => resolve(Component));
    });
  }
}

export class Routes {
  constructor(records) {
    this.routes = records.map(record => this.define(record));
  }

  define(record, parent) {
    if (parent != null) {
      record.path = normalize(parent.path + '/' + record.path);
    }

    if (record.children != null) {
      record.children = record.children
        .map(child => this.define(child, record));
    } else {
      record.exact = true;
    }
    
    return new Route(record);
  }

  [Symbol.iterator]() {
    return this.routes[Symbol.iterator]();
  }
}

export class ActiveRoute {
  constructor(route, url) {
    this.parameters = route.parse(url);
    this.matched = route.matched(url);
    this.query = Query.parse(url);
    this.hash = location.hash.substring(1);
  }
}