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
function decode(str) {
    return decodeURIComponent(str);
}
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
function pathname(path) {
    return (path.split('#')[0] || '').split('?')[0];
}
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
function empty() {
    return Object.create(null);
}
function always() {
    return true;
}
function zip(a, b) {
    return a.map((v, i) => [v, b[i]]);
}
function dict(pairs) {
    let index = -1;
    const length = pairs.length;
    const result = {};
    while (++index < length) {
        const pair = pairs[index];
        result[pair[0]] = pair[1];
    }
    return result;
}
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
        return dict(Array.from(this.entries()));
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
        return dict(Array.from(this.entries()));
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
        // declare anything
        if (exact == null) {
            exact = (children == null ||
                children.length === 0);
        }
        super(path, exact);
        this.path = path;
        this.exact = exact;
        this.redirect = redirect;
        this.component = component;
        this.slot = slot;
        this.guard = guard || always;
        this.properties = freeze(properties || empty);
        this.children = (children || []).map(child => createChildRoute(clone(child), this));
    }
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
    async import() {
        if (Route.cache.has(this.component)) {
            return Route.cache.get(this.component);
        }
        else {
            let ctor = await Route.import(this.component);
            Route.cache.set(this.component, ctor);
            return ctor;
        }
    }
    snapshot(identifier) {
        let uri;
        if (typeof identifier === 'string') {
            uri = split(identifier);
        }
        else {
            uri = identifier;
        }
        return freeze({
            parameters: this.parse(decode(uri.pathname)),
            query: Query.parse(decode(uri.search)),
            matched: this.matched(decode(uri.pathname)),
            hash: uri.hash
        });
    }
}
Route.cache = new Map();
function createChildRoute(record, parent) {
    if (record.path === '') {
        // If the path is empty, simply copy the parent path
        record.path = parent.path;
    }
    else {
        // Otherwise, prepend the parent path
        record.path = normalize(parent.path + '/' + record.path);
    }
    // Same idea with redirect
    if (record.redirect != null) {
        if (record.redirect === '') {
            record.redirect = parent.path;
        }
        else {
            record.redirect = normalize(parent.path + '/' + record.redirect);
        }
    }
    return new Route(record);
}

class Router extends EventEmitter {
    constructor(records) {
        super();
        this.isConnected = false;
        this.elements = [];
        this.matched = [];
        this.routes = records.map(record => new Route(record));
        this.onPopstate = this.onPopstate.bind(this);
        Router.instance = this;
    }
    async connect(target) {
        this.isConnected = true;
        this.target = target;
        window.addEventListener('popstate', this.onPopstate);
        const currentPath = decode(location.pathname);
        const { matched, path } = this.match(currentPath);
        history.replaceState(history.state, document.title, path);
        await this.render(matched);
        this.emit('connect');
    }
    disconnect() {
        this.isConnected = false;
        window.removeEventListener('popstate', this.onPopstate);
        this.teardown();
        this.matched = [];
        this.target = undefined;
        this.emit('disconnect');
    }
    onPopstate() {
        const to = decode(location.pathname);
        const { matched, path } = this.match(to);
        if (to !== path) {
            history.replaceState(history.state, document.title, path);
        }
        this.emit('pop');
        this.render(matched);
    }
    push(to, options = EMPTY) {
        to = decode(to);
        const { matched, path } = this.match(to);
        const { data, title } = options;
        history.pushState(data, title, path);
        this.emit('push');
        return this.render(matched);
    }
    replace(to, options = EMPTY) {
        to = decode(to);
        const { matched, path } = this.match(to);
        const { data, title } = options;
        history.replaceState(data, title, path);
        this.emit('replace');
        return this.render(matched);
    }
    go(entries) {
        // triggers onPopstate(), so no need to render
        // in this method call
        history.go(entries);
    }
    search(path, routes, matched) {
        const route = routes
            .find(r => r.matches(path) && r.guard());
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
        for (let i = 0; i < this.elements.length; i++) {
            // TODO: fix type
            const element = this.elements[i];
            const route = matched[i];
            // TODO: fix type
            const Component = components[i];
            const options = Component.properties;
            if (options != undefined) {
                const snapshot = route.snapshot(location);
                const parameters = snapshot.parameters;
                // Resolve parameters from paths
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
        this.emit('render');
    }
    teardown() {
        while (this.elements.length > 0) {
            const element = this.elements.pop();
            element.remove();
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
    get anchor() {
        return this.querySelector('a');
    }
    set to(v) {
        this.anchor.href = v;
        const path = decodeURIComponent(location.pathname);
        this.active = this.match(path);
    }
    get to() {
        return decodeURIComponent(this.anchor.pathname);
    }
    set exact(v) {
        this.toggleAttribute('exact', v);
        const path = decodeURIComponent(location.pathname);
        this.active = this.match(path);
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
    }
    connectedCallback() {
        this.addEventListener('click', this.onClick);
        this.router.on('render', this.onChange);
        this.onChange();
    }
    disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.router.off('render', this.onChange);
    }
    toggleAttribute(name, predicate) {
        if (predicate) {
            this.setAttribute(name, '');
        }
        else {
            this.removeAttribute(name);
        }
    }
    match(path) {
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
        // Ignore clicks with modifiers
        if (event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey) {
            return;
        }
        // Ignore prevented clicks
        if (event.defaultPrevented) {
            return;
        }
        // Ignore right mouse button clicks
        if (event.button !== undefined &&
            event.button !== 0) {
            return;
        }
        event.preventDefault();
        const to = this.to;
        if (this.disabled || !to) {
            return;
        }
        else {
            this.router.push(to);
        }
    }
    onChange() {
        const path = decodeURIComponent(location.pathname);
        this.active = this.match(path);
    }
}
RouterLink.observedAttributes = ['disabled'];
RouterLink.tagName = 'router-link';

export default Router;
export { Path, Query, Route, RouterLink };
