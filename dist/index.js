const MATCH_ALL = '[^/]*';
const CATCH_ALL = '([^/]+)';
const PARAMETER_PATTERN = /:([^\/]+)/;
// optional trailing slash
// only matches the slash if nothing follows
const MATCH_TRAILING_SLASH = '(?:[\/]?(?=$))?';
// implements '**' as a wildcard
const WILDCARD_PATTERN = /\*\*/g;
class Path {
    /**
     *
     * @param input The path to compile
     * @param exact Whether or not the pattern should match anything after the path
     */
    constructor(path = '', exact = false) {
        this.path = path;
        this.exact = exact;
        // replace any wildcards with
        // their corresponding expression
        let temporary = path.replace(WILDCARD_PATTERN, MATCH_ALL);
        let match;
        let keys = [];
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
    matches(path) {
        return this.pattern.test(path);
    }
    /**
     * Find the matched part of the given path.
     */
    matched(path) {
        let matched = this.pattern.exec(path);
        return matched && matched[0] || '';
    }
    /**
     * Parse a path string for parameter values.
     */
    parse(path) {
        return new Parameters(path, this.pattern, this.keys);
    }
    /**
     * Transfer matched parameters in the given url to
     * the target path, filling in named parameters in if they exist.
     * @param {String} from a matched url
     * @param {String} to a path
     * @return {String} The target path with parameters filled in
     */
    transfer(from, to) {
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
class Parameters {
    constructor(path, pattern, keys) {
        this.path = path;
        this.keys = keys;
        this.values = (pattern.exec(path) || []).slice(1);
    }
    get(key) {
        return this.values[this.keys.indexOf(key)];
    }
    set(key, value) {
        return this.path.replace(this.get(key), value);
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    entries() {
        let entries = [];
        for (let i = 0; i < this.keys.length; i++) {
            entries.push([this.keys[i], this.values[i]]);
        }
        return entries;
    }
    all() {
        return this.keys.reduce((object, key, i) => {
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

class Query extends Map {
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

/**
 * Append a leading slash, and remove all excess slashes.
 */
function normalize(path) {
    return ('/' + path).replace(/[\/]+/g, '/');
}
/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
 * @param object the object that is to be inspected
 * @returns `true` if the given object is a callable function
 */
function isFunction(object) {
    if (!(typeof object === 'function')) {
        return false;
    }
    /**
     * Values for `hasOwnProperty` on functions:
     *
     *           | Class | Ordinary | Arrow | Async | Generator |
     * ---------------------------------------------------------|
     * arguments | false |   true   | false | false |   false   |
     * prototype | true  |   true   | false | false |   true    |
     *
     */
    const tag = object[Symbol.toStringTag];
    if (tag === 'AsyncFunction' || tag === 'GeneratorFunction') {
        return true;
    }
    else {
        // Ordinary functions have an `arguments` property, which classes do not.
        const isNormalFunction = object.hasOwnProperty('arguments');
        // Arrow functions do not have a `prototype` property, which classes do.
        const isArrowFunction = !object.hasOwnProperty('prototype');
        return isNormalFunction || isArrowFunction;
    }
}
function clone(object) {
    return Object.assign({}, object);
}
function freeze(object) {
    return Object.freeze(object);
}
function always() {
    return true;
}
const EMPTY = freeze(Object.create(null));

class Route extends Path {
    static async import(identifier) {
        if (typeof identifier === 'string') {
            // If it's a string, assume that it has
            // been defined, and return the constructor
            // from the element registry
            return customElements.get(identifier);
        }
        else if (isFunction(identifier)) {
            // If it's a function, call it
            let called = identifier();
            // If it's a promise, resolve it
            let resolved = await Promise.resolve(called);
            // If the promise resolved directly to an element,
            // return it
            // otherwise, assume that it resolved to a module
            // with the default export being the element
            if (resolved.default) {
                return resolved.default;
            }
            else {
                return resolved;
            }
        }
        else {
            // If it's not a string or a promise,
            // it's just
            return identifier;
        }
    }
    constructor(record) {
        super(record.path, record.exact);
        this.path = record.path;
        this.exact = record.exact === true;
        this.redirect = record.redirect;
        this.component = record.component;
        this.slot = record.slot;
        this.guard = record.guard || always;
        this.meta = freeze(record.meta || {});
        this.properties = freeze(record.properties || {});
        this.children = (record.children || []).map(child => createChildRoute(clone(child), this));
    }
    async import() {
        if (this.resolved == null) {
            this.resolved = await Route.import(this.component);
        }
        return this.resolved;
    }
    snapshot(path) {
        return freeze({
            parameters: this.parse(path),
            query: Query.parse(location.search),
            matched: this.matched(path),
            hash: location.hash.substring(1)
        });
    }
}
function createChildRoute(record, parent) {
    if (record.path === '') {
        record.path = parent.path;
    }
    else {
        record.path = normalize(parent.path + '/' + record.path);
    }
    if (record.redirect != null) {
        if (record.redirect === '') {
            record.redirect = parent.path;
        }
        else {
            record.redirect = normalize(parent.path + '/' + record.redirect);
        }
    }
    if (record.children == null) {
        record.exact = true;
    }
    return new Route(record);
}

class Router {
    constructor(records, target) {
        this.isConnected = false;
        this.elements = [];
        this.matched = [];
        this.routes = records.map(record => new Route(record));
        this.onPopstate = this.onPopstate.bind(this);
        Router.instance = this;
        if (target) {
            this.connect(target);
        }
    }
    connect(target) {
        this.isConnected = true;
        this.target = target;
        window.addEventListener('popstate', this.onPopstate);
        const currentPath = decodeURIComponent(location.pathname);
        const { matched, path } = this.match(currentPath);
        history.replaceState(history.state, document.title, path);
        return this.render(matched);
    }
    disconnect() {
        this.isConnected = false;
        window.removeEventListener('popstate', this.onPopstate);
        this.teardown();
        this.matched = [];
        this.target = undefined;
    }
    onPopstate() {
        const path = decodeURIComponent(location.pathname);
        const { matched } = this.match(path);
        this.render(matched);
    }
    push(to, options = EMPTY) {
        to = decodeURIComponent(to);
        const { matched, path } = this.match(to);
        const { data, title } = options;
        history.pushState(data, title, path);
        return this.render(matched);
    }
    replace(to, options = EMPTY) {
        to = decodeURIComponent(to);
        const { matched, path } = this.match(to);
        const { data, title } = options;
        history.replaceState(data, title, path);
        return this.render(matched);
    }
    search(path, routes, matched) {
        const route = routes
            .find(r => r.matches(path) && r.guard());
        if (route) {
            matched.push(route);
            if (route.redirect) {
                // transfer any matched parameters
                const from = route.matched(path);
                const to = route.redirect;
                const redirected = route.transfer(from, to);
                // and start over
                return this.search(redirected, this.routes, []);
            }
            else if (route.children) {
                // Search through the children
                return this.search(path, route.children, matched);
            }
            else {
                return { matched, path };
            }
        }
        else {
            // End the search here
            return { matched, path };
        }
    }
    match(path) {
        return this.search(path, this.routes, []);
    }
    async render(matched) {
        if (this.target == undefined) {
            return;
        }
        // Importing early in case both network
        // and device is slow, but not awaiting
        // it just yet.
        const load = Promise.all(matched.map(route => route.import()));
        // Find the index at which the matched routes
        // differ from the active routes.
        let start;
        for (let i = 0; i < matched.length; i++) {
            const match = matched[i];
            if (this.matched.length < i + 1) {
                start = i;
                break;
            }
            else {
                const active = this.matched[i];
                if (match !== active) {
                    start = i;
                    break;
                }
            }
        }
        if (start == null) {
            start = matched.length;
        }
        this.matched = matched;
        // Remove the obsolete elements
        const removals = this.elements.slice(start);
        while (removals.length > 0) {
            const element = removals.pop();
            element.remove();
        }
        this.elements = this.elements.slice(0, start);
        const components = await load;
        // Create the new elements
        const additions = components.slice(start)
            .map((Component) => new Component());
        // Combine the newly created elements in order
        // while being careful not to render them yet
        for (let i = 0; i < additions.length - 1; i++) {
            const parent = additions[i];
            const child = additions[i + 1];
            parent.appendChild(child);
        }
        this.elements = this.elements.concat(additions);
        // In correct order, resolve any new properties
        // Note: this happens before the new elements are connected
        const url = decodeURIComponent(location.pathname);
        for (let i = 0; i < this.elements.length; i++) {
            // TODO: fix type
            const element = this.elements[i];
            const route = matched[i];
            // TODO: fix type
            const Component = components[i];
            const snapshot = route.snapshot(url);
            const parameters = snapshot.parameters;
            const options = Component.properties;
            if (options != undefined) {
                // Resolve parameters from paths
                for (const [key, value] of parameters) {
                    if (options.hasOwnProperty(key)) {
                        element[key] = value;
                    }
                }
                // Resolve additional properties from route
                for (const key in route.properties) {
                    if (options.hasOwnProperty(key)) {
                        const value = route.properties[key];
                        element[key] = value;
                    }
                }
            }
            element.route = snapshot;
            if (route.slot) {
                element.setAttribute('slot', route.slot);
            }
        }
        // If there are any additions, they need to be rendered
        if (additions.length > 0) {
            if (start > 0) {
                // Some reuse
                // Connect the new elements to the deepest reused element,
                // implicitly rendering them
                this.elements[start - 1].appendChild(additions[0]);
            }
            else {
                // No reuse
                this.target.appendChild(this.elements[0]);
            }
        }
    }
    teardown() {
        while (this.elements.length > 0) {
            const element = this.elements.pop();
            element.remove();
        }
    }
}

export default Router;
export { Path, Query, Route };
