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

class Query extends Map {
    static from(object) {
        return new Query(Object.entries(object));
    }
    static parse(string) {
        if (/\?/.test(string)) {
            string = string.replace(/^.*\?/, '');
        }
        if (/#/.test(string)) {
            string = string.replace(/#.*$/, '');
        }
        let entries = [];
        if (string !== '') {
            entries = string.split('&')
                .map((substring) => substring.split('='));
        }
        return new Query(entries);
    }
    toString() {
        return Array.from(this.entries())
            .map(entry => entry.join('='))
            .join('&');
    }
}

/**
 * Matches anything until the next '/', '?' or '#'.
 * Replacement for wildcards in path declarations when building a RegExp.
 */
const MATCH_ALL = '[^/?#]*';
/**
 * Captures anything until the next '/', '?' or '#'.
 * Replacement for parameters in path declarations when building a RegExp.
 */
const CATCH_ALL = '([^/?#]+)';
/**
 * Matches an optional trailing '/', if it is not followed by anything.
 * Appended to the end of path declarations when building a RegExp.
 *
 * Notes:
 * - Does nothing on its own
 * - Does nothing without a trailing '$'
 *
 * @example
 * const pattern = new RegExp('^/abc' + MATCH_TRAILING_SLASH + '$');
 * pattern.test('/abc'); // => true
 * pattern.test('/abc/'); // => true
 * pattern.test('/abc/def'); // => false
 *
 */
const MATCH_TRAILING_SLASH = '(?:[/]?(?=$))?';
/**
 * Matches an optional query string.
 */
const MATCH_TRAILING_QUERY = '(?:\\?.*)?';
/**
 * Matches an optional hash string.
 */
const MATCH_TRAILING_HASH = '(?:#.*)?';
/**
 * Matches '**'.
 *
 * Determines where to swap in a match-all pattern.
 */
const WILDCARD_PATTERN = /\*\*/g;
/**
 * Matches ':param' and captures 'param'.
 *
 * Determines where to swap in a catch-all pattern, or
 * extracts parameter names from a path.
 */
const PARAMETER_PATTERN = /:([^\/?#]+)/g;

/**
 * Extract the keys in a path declaration.
 * @example
 * parse('/:a/:b/:c'); // => ['a', 'b', 'c']
 *
 * @param path A path declaration
 */
const parse = (path) => {
    let keys = [];
    let match;
    while ((match = PARAMETER_PATTERN.exec(path)) != null) {
        keys.push(match[1]);
    }
    return keys;
};

/**
 * Create a regular expression from a path with (optional) encoded parameters in it.
 * `exact` determines if the resulting expression should match
 * any superset of the given path or only match equal segment-length paths.
 *
 * @example
 * // not exact
 * compile('/:a').test('/b'); // => true
 * compile('/:a').test('/a/b'); // => true
 * // exact
 * compile('/:a', true).test('/a'); // => true
 * compile('/:a', true).test('/a/b'); // => false
 *
 * @param path A path declaration
 * @param exact If `true`, the resulting expression will only match
 * 1:1 (instead of matching any superset of the given path).
 */
const compile = (path, exact = false) => (new RegExp('^' +
    path
        // Replace '**' with a matching group
        .replace(WILDCARD_PATTERN, MATCH_ALL)
        // Replace ':key' with a catching group
        .replace(PARAMETER_PATTERN, CATCH_ALL)
    // Match an optional trailing slash
    + MATCH_TRAILING_SLASH
    // If exact, only match completely
    + (exact
        ? MATCH_TRAILING_QUERY + MATCH_TRAILING_HASH + '$'
        : ''), 'i'));

/**
 * Retrieve the values embedded in a string using a
 * regular expression obtained from `compile`.
 *
 * @example
 * const pattern = compile('/:a');
 * execute(pattern, '/value'); // => ['value']
 *
 * @param pattern The pattern returned from `compile`
 * @param path The live path
 */
const execute = (pattern, path) => ((pattern.exec(path) || []).slice(1));

const zip = (a, b) => (a.map((v, i) => [v, b[i]]));
/**
 * Convert an array of keys and an array of values into a Map.
 *
 * @example
 * const keys = parse('/:a/:b');
 * const pattern = compile('/:a/:b');
 * const values = execute(pattern, '/some/path');
 * map(keys, values); // => Map {'a' => 'some', 'b' => 'path'}
 *
 * @param keys The keys returned from `parse`
 * @param values The values returned from `execute`
 */
const map = (keys, values) => (new Map(zip(keys, values)));

/**
 * Convert an array of keys and an array of values into a plain object.
 * @example
 * const keys = parse('/:a/:b');
 * const pattern = compile('/:a/:b');
 * const values = execute(pattern, '/some/path');
 * object(keys, values); // => { a: 'some', b: 'path' }
 *
 * @param keys The keys returned from `parse`
 * @param values The values returned from `execute`
 */
const object = (keys, values) => (keys.reduce((acc, key, i) => {
    acc[key] = values[i];
    return acc;
}, {}));

class Path {
    constructor(path, exact = false) {
        this.keys = parse(path);
        this.pattern = compile(path, exact);
    }
    /**
     * Test if the Path matches the given string.
     *
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.matches('/1/2/3'); // => true
     * path.matches('/1/2'); // => false
     * path.matches('/1/2/3/4'); // => true
     *
     * @param string The string to test against
     */
    matches(string) {
        return this.pattern.test(string);
    }
    /**
     * Extract the matched part of the given string according to this Path.
     *
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.matched('/1/2/3'); // => '/1/2/3'
     * path.matched('/1/2/3/4'); // => '1/2/3'
     *
     * @param string The string to match against
     */
    matched(string) {
        const matched = this.pattern.exec(string);
        return matched && matched[0] || '';
    }
    /**
     * Extract the values in the given string according to this Path's
     * initial declaration.
     *
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.values('/1/2/3'); // => ['1', '2', '3']
     *
     * @param string The string to extract values from
     */
    values(string) {
        return execute(this.pattern, string);
    }
    /**
     * Extract the values in the given string, and combine them
     * with the keys for this Path to create a Map instance.
     *
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.toMap('/1/2/3'); // => Map { 'a' => '1', 'b' => '2', 'c' => '3' }
     *
     * @param string The string to extract values from
     */
    toMap(string) {
        const values = this.values(string);
        return map(this.keys, values);
    }
    /**
     * Extract the values in the given string, and combine them
     * with the keys for this Path to create a simple object.
     *
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.toMap('/1/2/3'); // => { a: '1', b: '2', c: '3' }
     *
     * @param string The string to extract values from
     */
    toObject(string) {
        const values = this.values(string);
        return object(this.keys, values);
    }
    /**
     * Transfer parameters in a string (`source`) according to the
     * Path declaration to construct another path (`target`).
     * @example
     * const path = new Path('/:a/:b/:c');
     * path.transfer('/1/2/3', '/:a'); // => '/1'
     * path.transfer('/1/2/3', '/:b'); // => '/2'
     * path.transfer('/1/2/3', '/:c/:b/:a/abc'); // => '/3/2/1/abc'
     *
     * @param source The string that contains values
     * @param target The path that will receive values
     */
    transfer(source, target) {
        const values = this.values(source);
        let i = values.length;
        while (i--) {
            target = target
                .replace(':' + this.keys[i], values[i]);
        }
        return target;
    }
}

/**
 * Convert 'PascalCase' or 'camelCase' to 'dash-case'.
 * @param str A PascalCase og camelCase string
 */
function empty() {
    return Object.create(null);
}
/**
 * Shorthand for `Object.freeze`.
 * @param object
 */
function freeze(object) {
    return Object.freeze(object);
}
/**
 * Always returns `true`.
 */
function always() {
    return true;
}
const EMPTY = freeze(empty());

/**
 * Append a leading slash, and remove all excess slashes.
 */
function normalize(path) {
    return ('/' + path).replace(/[\/]+/g, '/');
}
/**
 * Shorthand for `decodeURIComponent`
 */
function decode$1(str) {
    return decodeURIComponent(str);
}

class Route extends Path {
    constructor(record) {
        let { path, component, exact, redirect, slot, guard, properties, children } = record;
        // Path should be exact if the route
        // does not have any children,
        // but only if the record does not
        // specify anything
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
    async import() {
        const cache$$1 = Route.cache;
        const component = this.component;
        if (isHTMLElement(component)) {
            return component;
        }
        else if (cache$$1.has(component)) {
            return cache$$1.get(component);
        }
        else {
            const res = await this.component();
            const ctor = res.default;
            cache$$1.set(component, ctor);
            return ctor;
        }
    }
    snapshot(source) {
        const { pathname, search, hash } = source;
        return {
            parameters: this.toMap(decode$1(pathname)),
            query: Query.parse(decode$1(search)),
            matched: this.matched(decode$1(pathname)),
            hash: hash.substring(1)
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
function isHTMLElement(o) {
    return HTMLElement.isPrototypeOf(o);
}

const h = history;
class History extends EventEmitter {
    constructor() {
        super();
        this.onPopstate = this.onPopstate.bind(this);
    }
    connect() {
        window.addEventListener('popstate', this.onPopstate);
    }
    disconnect() {
        window.removeEventListener('popstate', this.onPopstate);
    }
    onPopstate() {
        const path = decode$1(location.pathname);
        this.emit('pop', { path });
    }
    push(path, options = {}) {
        const { data, title } = options;
        h.pushState(data, title || document.title, path);
        this.emit('push', { path });
    }
    replace(path, options = {}) {
        const { data, title } = options;
        h.replaceState(data, title || document.title, path);
        this.emit('replace', { path });
    }
    pop(n = 1) {
        h.go(-n);
    }
}

class Router extends EventEmitter {
    constructor(records) {
        super();
        this.isConnected = false;
        this.elements = [];
        this.activeRoutes = [];
        this.routes = records.map(record => new Route(record));
        this.onPopstate = this.onPopstate.bind(this);
        this.history = new History();
        this.history.on('pop', this.onPopstate);
    }
    /**
     * Connect the router to an element.
     * This checks the current location for matching,
     * and renders those matched elements.
     */
    async connect(root) {
        this.isConnected = true;
        this.root = root;
        const to = decode$1(location.pathname);
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
        this.activeRoutes = [];
        this.root = undefined;
        this.teardown();
        this.history.disconnect();
        this.emit('disconnect');
    }
    onPopstate(to) {
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
    async push(to, options) {
        to = decode$1(to);
        const { matched, path } = this.match(to);
        this.history.push(path, options);
        this.emit('push');
        await this.render(matched);
    }
    /**
     * Replace the topmost entry in the history stack.
     */
    async replace(to, options) {
        to = decode$1(to);
        const { matched, path } = this.match(to);
        this.history.replace(path, options);
        this.emit('replace');
        await this.render(matched);
    }
    /**
     * Pop the top `n` entries off of history stack.
     */
    pop(n = 1) {
        // triggers onpop(), so no need to render here
        this.history.pop(n);
    }
    search(path, routes, matched) {
        const route = routes.find(r => r.matches(path) && r.guard());
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
    /**
     * Search for the elements that would match the given path.
     * If a redirect is encountered, it will be followed.
     * The resulting path and the matched elements are returned.
     */
    match(path) {
        return this.search(path, this.routes, []);
    }
    /**
     * Render the given routes.
     * The routes are assumed to be nested.
     */
    async render(matchedRoutes) {
        if (this.root == undefined) {
            return;
        }
        // Importing early, but deliberately not awaiting
        const load = Promise.all(matchedRoutes.map(route => route.import()));
        // Find the index at which the matched routes
        // differ from the active routes.
        let startIndex;
        const activeRoutes = this.activeRoutes;
        const length = Math.min(matchedRoutes.length, activeRoutes.length);
        for (startIndex = 0; startIndex < length; startIndex++) {
            if (matchedRoutes[startIndex] !== activeRoutes[startIndex])
                break;
        }
        this.activeRoutes = matchedRoutes;
        // Remove the obsolete elements from the DOM
        const removals = this.elements.slice(startIndex);
        while (removals.length > 0) {
            const element = removals.pop();
            if (element && element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }
        // Discard references to the removed elements
        this.elements = this.elements.slice(0, startIndex);
        // Wait for any asynchronous components to load
        const components = await load;
        // Create the new elements
        const additions = components
            .slice(startIndex)
            .map((Component) => new Component());
        this.elements = this.elements.concat(additions);
        // Add slot attributes if needed
        for (let i = startIndex; i < this.elements.length; i++) {
            const element = this.elements[i];
            const route = this.activeRoutes[i];
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
            if (startIndex > 0) {
                // Some reuse
                // Connect the new elements to the deepest reused element,
                // implicitly rendering them
                this.elements[startIndex - 1].appendChild(additions[0]);
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
            const definition = customElements.get(element.tagName.toLowerCase());
            const options = definition.properties;
            const route = this.activeRoutes[i];
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
                const keys = Object.keys(properties);
                for (const key of keys) {
                    if (options.hasOwnProperty(key)) {
                        element[key] = properties[key];
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
            // need to use parentElement.removeChild()
            // (as opposed to element.remove())
            // to avoid bug in Edge
            if (element && element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }
    }
}

class RouterLink extends HTMLElement {
    constructor() {
        super();
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
    }
    static define(tagName = 'router-link', options) {
        this.tagName = tagName;
        this.router = options.router;
        customElements.define(tagName, this);
    }
    set to(v) {
        this.setAttribute('to', v);
    }
    get to() {
        return this.getAttribute('to');
    }
    set exact(v) {
        this.toggleAttribute('exact', v);
        this.active = this.test(decode$1(location.pathname));
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
    get router() {
        return RouterLink.router;
    }
    attributeChangedCallback(attr, oldValue, newValue) {
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
            this.active = this.test(decode$1(location.pathname));
        }
    }
    connectedCallback() {
        const a = this.querySelector('a');
        if (a) {
            if (!this.to) {
                this.to = decode$1(a.pathname);
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
        this.active = this.test(decode$1(location.pathname));
    }
}
RouterLink.observedAttributes = ['disabled', 'to'];
RouterLink.tagName = 'router-link';

export default Router;
export { Router, RouterLink };
