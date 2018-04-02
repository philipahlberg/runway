class EventEmitter {
    constructor() {
        this.map = new Map();
    }
    on(type, listener) {
        let listeners;
        if (!this.map.has(type)) {
            listeners = new Set();
            this.map.set(type, listeners);
        }
        else {
            listeners = this.map.get(type);
        }
        listeners.add(listener);
    }
    off(type, listener) {
        if (!this.map.has(type)) {
            return;
        }
        const listeners = this.map.get(type);
        listeners.delete(listener);
    }
    emit(type, detail) {
        if (!this.map.has(type)) {
            return;
        }
        const listeners = this.map.get(type);
        for (const listener of listeners) {
            listener(detail);
        }
    }
}

/**
 * Append a leading slash, and remove all excess slashes.
 */
function normalize(path) {
    return ('/' + path).replace(/[\/]+/g, '/');
}
/**
 * Shorthand for `decodeURIComponent`
 */
function decode(str) {
    return decodeURIComponent(str);
}
/**
 * Split the pathname, search (query) and hash of a path.
 */
function split(path) {
    let temp = path.split('#');
    const hash = temp[1] || '';
    temp = (temp[0] || '').split('?');
    const search = temp[1] || '';
    const pathname = temp[0] || '';
    return {
        pathname,
        search,
        hash
    };
}
/**
 * Extract the pathname of a path (i. e. excluding the search and hash).
 */
function pathname(path) {
    return (path.split('#')[0] || '').split('?')[0];
}
/**
 * Extract the search (query) of a path.
 */
function search(path) {
    path = (path.split('#')[0] || '');
    if (/\?/.test(path)) {
        return path.split('?')[1] || '';
    }
    else {
        return path;
    }
}
/**
 * Determines if the given object is a callable function.
 * An ES2015 class will return false, while ordinary functions,
 * arrow functions, generator functions and async functions return true.
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
/**
 * Determine if the given object is an ES module (the return value of `import()`)
 * or a shim (like `require()`)
 */
function isModule(object) {
    return object[Symbol.toStringTag] === 'Module' || object.__esModule;
}
/**
 * Shorthand for `Object.freeze`.
 */
function freeze(object) {
    return Object.freeze(object);
}
/**
 * Shorthand for `Object.create(null)`.
 */
function empty() {
    return Object.create(null);
}
/**
 * Always returns `true`.
 */
function always() {
    return true;
}
/**
 * Combine two arrays to an array of tuples.
 */
function zip(a, b) {
    return a.map((v, i) => [v, b[i]]);
}
/**
 * Convert an array of tuples to an object in which each key
 * is the first element of the tuple and the value is the second element of the tuple.
 */
function dictionary(pairs) {
    let index = -1;
    const length = pairs.length;
    const result = {};
    while (++index < length) {
        const pair = pairs[index];
        result[pair[0]] = pair[1];
    }
    return result;
}
/**
 * A frozen object with no prototype chain.
 */
const EMPTY = freeze(Object.create(null));

const MATCH_ALL = '[^/]*';
const CATCH_ALL = '([^/]+)';
const PARAMETER_PATTERN = /:([^\/]+)/;
// optional trailing slash
// only matches the slash if nothing follows
const MATCH_TRAILING_SLASH = '(?:[\/]?(?=$))?';
// implements '**' as a wildcard
const WILDCARD_PATTERN = /\*\*/g;
class Path {
    constructor(path = '', exact = false) {
        path = pathname(path);
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
    matches(path) {
        return this.pattern.test(pathname(path));
    }
    /**
     * Find the matched part of the given path.
     */
    matched(path) {
        let matched = this.pattern.exec(pathname(path));
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
class Parameters extends Map {
    constructor(path, pattern, keys) {
        path = pathname(path);
        const values = (pattern.exec(path) || []).slice(1);
        super(zip(keys, values));
        this.path = path;
    }
    all() {
        return dictionary(Array.from(this.entries()));
    }
}

class Query extends Map {
    static from(object) {
        return new Query(Object.entries(object));
    }
    static parse(string) {
        const queryString = search(string);
        let entries = [];
        if (queryString !== '') {
            entries = queryString.split('&')
                .map((substring) => substring.split('='));
        }
        return new Query(entries);
    }
    all() {
        return dictionary(Array.from(this.entries()));
    }
    toString() {
        let string = '';
        for (const [key, value] of this) {
            string += `&${key}=${value}`;
        }
        return string.substring(1);
    }
}

class Route extends Path {
    constructor(record) {
        let { path, component, exact, redirect, slot, guard, properties, children } = record;
        // Path should be exact if the route
        // does not have any children,
        // but only if the record does not
        // specifically declare anything
        if (exact == null) {
            exact = (children == null ||
                children.length === 0);
        }
        super(path, exact);
        this.path = path;
        this.exact = exact;
        this.redirect = redirect;
        this.component = typeof component === 'string'
            ? customElements.get(component)
            : component;
        this.slot = slot;
        this.guard = guard || always;
        this.properties = properties || empty;
        this.children = (children || []).map(child => createChildRoute(child, this));
    }
    static async import(identifier) {
        if (isFunction(identifier)) {
            // If it's a function, call it
            let called = identifier();
            // If it's a promise, resolve it
            let resolved = await Promise.resolve(called);
            // If the promise resolved to a module, assume
            // the constructor is the default export
            // Otherwise, assume the promise resolved
            // to a constructor
            if (isModule(resolved)) {
                return resolved.default;
            }
            else {
                return resolved;
            }
        }
        else {
            // If it's not a function,
            // assume it's a constructor
            return identifier;
        }
    }
    async import() {
        if (!isFunction(this.component)) {
            return this.component;
        }
        else if (Route.cache.has(this.component)) {
            return Route.cache.get(this.component);
        }
        else {
            const ctor = await Route.import(this.component);
            Route.cache.set(this.component, ctor);
            return ctor;
        }
    }
    snapshot(location) {
        const { pathname: pathname$$1, search: search$$1, hash: hash$$1 } = typeof location === 'string'
            ? split(location)
            : location;
        return {
            parameters: this.parse(decode(pathname$$1)),
            query: Query.parse(decode(search$$1)),
            matched: this.matched(decode(pathname$$1)),
            hash: hash$$1
        };
    }
}
Route.cache = new WeakMap();
function createChildRoute(record, parent) {
    if (record.path === '') {
        record.path = parent.path;
    }
    else {
        record.path = normalize(parent.path + '/' + record.path);
    }
    if (record.redirect != null) {
        record.redirect = normalize(parent.path + '/' + record.redirect);
    }
    return new Route(record);
}

const h = history;
const onpop = Symbol('onpop');
class History {
    constructor(listener) {
        this.onPopstate = listener;
        this[onpop] = this[onpop].bind(this);
    }
    connect() {
        window.addEventListener('popstate', this[onpop]);
    }
    disconnect() {
        window.removeEventListener('popstate', this[onpop]);
    }
    [onpop]() {
        const to = decode(location.pathname);
        this.onPopstate(to);
    }
    push(path, options = EMPTY) {
        const { data, title } = options;
        h.pushState(data, title, path);
    }
    replace(path, options = EMPTY) {
        const { data, title } = options;
        h.replaceState(data, title, path);
    }
    go(delta) {
        h.go(delta);
    }
}

class Router extends EventEmitter {
    constructor(records) {
        super();
        this.isConnected = false;
        this.elements = [];
        this.matched = [];
        this.routes = records.map(record => new Route(record));
        this.onpop = this.onpop.bind(this);
        this.history = new History(this.onpop);
        Router.instance = this;
    }
    /**
     * Connect the router to an element.
     * This checks the current location for matching,
     * and renders those matched elements.
     */
    async connect(root) {
        this.isConnected = true;
        this.root = root;
        const to = decode(location.pathname);
        const { matched, path } = this.match(to);
        this.history.connect();
        this.history.replace(path);
        await this.render(matched);
        this.emit('connect');
    }
    /**
     * Disconnect the router from it's current root element.
     * This removes all the elements currently rendered, and
     * removes all listeners, effectively leaving the router inactive.
     */
    disconnect() {
        this.isConnected = false;
        this.matched = [];
        this.root = undefined;
        this.teardown();
        this.history.disconnect();
        this.emit('disconnect');
    }
    /**
     * @private
     */
    onpop(to) {
        const { matched, path } = this.match(to);
        if (to !== path) {
            this.history.replace(path);
        }
        this.emit('pop');
        this.render(matched);
    }
    /**
     * Push a history entry onto the stack.
     */
    push(to, options) {
        to = decode(to);
        const { matched, path } = this.match(to);
        this.history.push(path, options);
        this.emit('push');
        return this.render(matched);
    }
    /**
     * Replace the topmost entry in the history stack.
     */
    replace(to, options) {
        to = decode(to);
        const { matched, path } = this.match(to);
        this.history.replace(path, options);
        this.emit('replace');
        return this.render(matched);
    }
    /**
     * Traverse through the history stack.
     */
    go(entries) {
        // triggers onpop(), so no need to render
        // in this method call
        this.history.go(entries);
    }
    /**
     * @private
     */
    search(path, routes, matched) {
        const route = routes.find(r => r.matches(path) && r.guard());
        if (route) {
            matched.push(route);
            if (route.redirect) {
                // transfer any matched parameters
                const from = route.matched(pathname(path));
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
    /**
     * @private
     * Search for the elements that would match the given path.
     * If a redirect is encountered, it will be followed.
     * The resulting path and the matched elements are returned.
     */
    match(path) {
        return this.search(path, this.routes, []);
    }
    /**
     * @private
     * Render the given routes.
     * The routes are assumed to be nested.
     */
    async render(matched) {
        if (this.root == undefined) {
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
        // Remove the obsolete elements from the DOM
        const removals = this.elements.slice(start);
        while (removals.length > 0) {
            const element = removals.pop();
            element.parentElement.removeChild(element);
        }
        // Discard the removed elements
        this.elements = this.elements.slice(0, start);
        // Wait for any asynchronous components to load
        const components = await load;
        // Create the new elements
        const additions = components
            .slice(start)
            .map((Component) => new Component());
        this.elements = this.elements.concat(additions);
        // Add slot attributes if needed
        for (let i = start; i < this.elements.length; i++) {
            const element = this.elements[i];
            const route = this.matched[i];
            if (route.slot) {
                element.setAttribute('slot', route.slot);
            }
        }
        // Combine the newly created elements in order
        // Note: they are not connected to the DOM here
        for (let i = 0; i < additions.length - 1; i++) {
            const parent = additions[i];
            const child = additions[i + 1];
            parent.appendChild(child);
        }
        // Resolve any new properties
        this.updateProperties();
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
                this.root.appendChild(this.elements[0]);
            }
        }
        this.emit('render');
    }
    /**
     * Update all `:param` bindings and `properties` functions in the tree.
     */
    updateProperties() {
        for (let i = 0; i < this.elements.length; i++) {
            const element = this.elements[i];
            const options = customElements.get(element.tagName.toLowerCase()).properties;
            const route = this.matched[i];
            if (options != undefined) {
                const snapshot = route.snapshot(window.location);
                const parameters = snapshot.parameters;
                // Resolve parameters from path
                for (const [key, value] of parameters) {
                    if (options.hasOwnProperty(key)) {
                        element[key] = value;
                    }
                }
                // Resolve additional properties from route
                const properties = route.properties(snapshot);
                for (const key in properties) {
                    if (options.hasOwnProperty(key)) {
                        const value = properties[key];
                        element[key] = value;
                    }
                }
            }
        }
    }
    /**
     * Remove all currently active elements.
     */
    teardown() {
        while (this.elements.length > 0) {
            const element = this.elements.pop();
            element.parentElement.removeChild(element);
        }
    }
}

class RouterLink extends HTMLElement {
    constructor() {
        super();
        this.router = Router.instance;
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }
    static install() {
        customElements.define(this.tagName, this);
    }
    set to(v) {
        this.setAttribute('to', v);
    }
    get to() {
        return this.getAttribute('to');
    }
    set exact(v) {
        this.toggleAttribute('exact', v);
        this.active = this.test(decode(location.pathname));
    }
    get exact() {
        return this.hasAttribute('exact');
    }
    set active(v) {
        this.toggleAttribute('active', v);
    }
    get active() {
        return this.hasAttribute('active');
    }
    set disabled(v) {
        this.toggleAttribute('disabled', v);
    }
    get disabled() {
        return this.hasAttribute('disabled');
    }
    attributesChangedCallback(attr, oldValue, newValue) {
        console.log({ attr, oldValue, newValue });
        if (oldValue === newValue) {
            return;
        }
        if (attr === 'disabled') {
            const hasValue = newValue != null;
            if (hasValue) {
                this.active = false;
                this.router.off('render', this.onChange);
            }
            else {
                this.router.on('render', this.onChange);
                this.onChange();
            }
        }
        else if (attr === 'to') {
            const a = this.querySelector('a');
            if (a) {
                a.href = newValue;
            }
            this.active = this.test(decode(location.pathname));
        }
    }
    connectedCallback() {
        const a = this.querySelector('a');
        if (a) {
            if (!this.to) {
                this.to = decode(a.pathname);
            }
            else {
                a.href = this.to;
            }
        }
        this.addEventListener('click', this.onClick);
        this.router.on('render', this.onChange);
        this.onChange();
    }
    disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.router.off('render', this.onChange);
    }
    toggleAttribute(name, predicate) {
        if (predicate != null) {
            if (predicate) {
                this.setAttribute(name, '');
            }
            else {
                this.removeAttribute(name);
            }
        }
        else {
            this.toggleAttribute(name, !this.hasAttribute(name));
        }
    }
    test(path) {
        const to = this.to;
        if (to.startsWith('/')) {
            return this.exact
                ? path === to
                : path.startsWith(to);
        }
        else {
            return path.endsWith(to);
        }
    }
    onClick(event) {
        if (
        // Ignore clicks with modifiers
        event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey ||
            // Ignore prevented clicks
            event.defaultPrevented ||
            // Ignore right mouse button clicks
            (event.button !== undefined &&
                event.button !== 0)) {
            return;
        }
        event.preventDefault();
        if (this.disabled || !this.to) {
            return;
        }
        else {
            this.router.push(this.to);
        }
    }
    onChange() {
        this.active = this.test(decode(location.pathname));
    }
}
RouterLink.observedAttributes = ['disabled'];
RouterLink.tagName = 'router-link';

export default Router;
export { Router, RouterLink, Query };
