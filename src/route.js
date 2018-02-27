import { Path } from './path.js';
import { Query } from './query.js';
import { load, normalize, isFunction, isPromise } from './utils.js';

const clone = (obj) => Object.assign({}, obj);
const freeze = (obj) => Object.freeze(obj);

export class Route extends Path {
  constructor(options) {
    super(options.path, options.exact);
    this.path = options.path;
    this.exact = options.exact === true;
    this.redirect = options.redirect;
    this.component = options.component;
    this.slot = options.slot;
    this.meta = freeze(options.meta || {});
    this.properties = freeze(options.properties || {});
    this.children = (options.children || [])
      .map(record => createChildRoute(clone(record), this));
  }

  async import() {
    return new Promise((resolve) => {
      load(this.component, (Component) => resolve(Component));
    });
  }
}

function createChildRoute(record, parent) {
  if (record.path === '') {
    record.path = parent.path;
  } else {
    record.path = normalize(parent.path + '/' + record.path);
  }

  if (record.redirect != null) {
    if (record.redirect === '') {
      record.redirect = parent.path;
    } else {
      record.redirect = normalize(parent.path + '/' + record.redirect);
    }
  }

  if (record.children == null) {
    record.exact = true;
  }

  return new Route(record);
}

export class ActiveRoute {
  constructor(route, url) {
    this.parameters = route.parse(url);
    this.matched = route.matched(url);
    this.query = Query.parse(url);
    this.hash = location.hash.substring(1);
  }
}