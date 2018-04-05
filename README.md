# Runway
A modern router for building single-page applications with web components.

## Overview
Runway is heavily inspired by the Vue router, so if you've used that before, you should feel right at home with Runway.

Getting started with Runway is fairly simple. At its core, Runway is a mapping of URL paths to components; you declare a path, and the component you want to be rendered when the path is visited:
```js
import Router from 'runway';

// 1. Import your component(s)
import Component from './my-component.js';

// 2. Define your routes
const routes = [
  {
    path: '/foo',
    component: Component
  }
];

// 3. Create the router
const router = new Router(routes);

// 4. Connect the router to an element
router.connect(document.body);
```
To visit `'/foo'`, you can:

  1) Call `router.push('/foo')` (or `router.replace('/foo')`)
  2) Use a `<router-link>` in the DOM, and click it


If you need your route to match a pattern instead of a path, you can use Express-like named parameters in the path:
```js
const router = new Router([
  {
    path: '/:param',
    component: Component
  }
]);
```
Then, if the associated component has a static `properties` object, and it contains a key matching the parameters name, the value of the parameter in the path will automatically be passed to the component:
```js
// somewhere-else.js
router.push('/foo');

// my-component.js
class Component extends HTMLElement {
  static get properties() {
    return {
      param: String // or param: { /* ... */ }
    }
  }

  connectedCallback() {
    console.log(this.param === 'foo'); // true
  }
}
```

If you need to pass another value, like the hash or the query of the current location, you can use a `properties` function to do so:
```js
const router = new Router([
  {
    path: '/login',
    component: LoginComponent,
    properties: (route) => ({
      foo: route.query.get('foo')
    })
  }
]);
```

Here, the components' `foo` property will be passed the value of the corresponding query (i. e. if the query is `?foo=bar`, the value will be `bar`). 
Note, however, that this will only be updated whenever navigation occurs (via `router.push`/`router.replace` or navigating with the browser's back/forward buttons).

A route can also redirect to another path instead of rendering a component:
```js
const router = new Router([
  {
    path: '/foo',
    redirect: '/bar'
  },
  {
    path: '/bar',
    component: DashboardComponent
  }
]);
```
Then, if the user visits `/foo`, they will automatically be redirected to `/bar` and the corresponding routes will be rendered instead.

Routes can be nested inside eachother, so that components are nested when rendered.
Given a configuration like so:
```js
const router = new Router([
  {
    path: '/foo',
    component: ComponentA,
    children: [
      {
        path: 'bar',
        component: ComponentB
      }
    ]
  }
]);
```
and the user visits /foo/bar, the components will be rendered like so:
```html
<component-a>
  <component-b>
  </component-b>
</component-a>
```
Note that nested routes should not have a leading slash.

If you need your route to conditionally match based on some external value, use a route guard to determine if it should match:
```js
const router = new Router([
  {
    path: '/admin',
    component: AdminComponent,
    guard: () => user.isAdmin
  }
]);
```
This way, the route will be skipped if the guard function returns `false`.

To see more features, take a look at the `/example` directory or try it in action:
```console
yarn run example
```

## API
### `class Router`
Exported as `Router` and `default`.
- **constructor(routes: Record[]): Router**

  Creates the router instance. Note that this does not render anything, nor does it add any listeners.
- **connect(root: HTMLElement): Promise\<void>**

  Connect the router to the DOM. The promise resolves once every component has been loaded and connected.
- **disconnect(): void**

  Disconnect the router from the DOM.
- **push(path: string, options?: Options): Promise\<void>**

  Push a new entry onto the history stack. Resolves once every component has been loaded and connected.
- **replace(path: string, options?: Options): Promise\<void>**

  Replace the current entry in the history stack.
- **go(entries: number): void**

  Traverse the history stack.

### `interface Record`
- **path: string**

  This is the path that the route should match.
  Use named parameters (`/:parameter`) to match dynamic values and pass them to the component as properties, or use a wildcard (`**`) to match anything.
- **component?: HTMLElement | Promise<{ default: HTMLElement }> | string**

  The component that should be rendered.
  Use the component's class declaration for eagerly-loaded components, or pass a function that returns a Promise (like `() => import('./component.js`) to lazy-load the component when the route matches the first time. Note that the component needs to be the default export of the module when using `import()`.
- **exact?: boolean**

  Whether or not the route should match "exactly"; `{ path: '/', exact: false }` would match any path (because any path begins with '/') while `{ path: '/' exact: true }` would *only* match '/'.
  By default, the route will match exactly when no child routes are attached, otherwise it will not.
- **redirect?: string**

  If a redirect is provided, the router will change the URL to match it and instead render the routes that match the new URL.
- **slot?: string**

  Render the component in a specific slot.
- **guard?: () => boolean**

  A function that allows selective matching; returning `false` means the route will be skipped.
- **properties?: (snapshot: Snapshot) => { [key: string]: string }**

  `properties` allows certain route-specific properties to be passed to the component. The snapshot contains information such as the parameters from the route, the matched path, the query and the hash.
- **children?: Record[]**

  An array of records. The paths of these nested records are appended to the parent record; Given `{ path: '/', children: [{ path: 'abc' }] }`, the path '/abc' would mean that both routes activate while the path '/' would mean that the topmost route activates.

### `class Parameters extends Map<string, string>`
A mapping of parameter names to resolved parameter values in the given path.
Use `Map`'s built in methods to access the values.
- **path: string**
- **all(): { [key: string]: string }**

  Converts the entries in the map into a simple object, where the keys are the parameter names and the values are their resolves values.

### `class Query extends Map<string, string>`
Exported as `Query`.
A generic class for working with queries (the `?key=value` bit).
- **static from(object: { [key: string]: string }): Query**

  Construct a Query from a simple object.
- **static parse(string: string): Query**

  Construct a Query from a string.
- **all(): { [key: string]: string }**

  Convert the Query to a simple object.
- **toString(): string**

  Convert the Query to a query-string, suitable for using directly in a path.

### `<router-link>`
Exported as `RouterLink`. Use `RouterLink.install()` to define the element.
- **to: string [attribute]**
- **exact: boolean [attribute]**
- **disabled: boolean [attribute]**
- **active: boolean [attribute]**

A custom element that integrates with the `Router` like an `<a>` element. When the location's pathname matches that of the element, it gains an `active` attribute, which is useful for applying styles to match.
Can be used as a standalone element:
```html
<router-link to="/path">
  Link
<router-link>
```
or as a wrapper around an `<a>` element:
```html
<router-link>
  <a href="/path">Link</a>
<router-link>
```
The latter is useful if progressive enhancement is desired (e.g. if JavaScript is disabled, navigation is still possible).

If you're changing the target of the link during it's lifetime (e.g. if you're using a data-binding system), using the `to` attribute/property is preferred, as that will notify the element when any changes occur and apply the `active` attribute as appropriate. The two patterns can be combined:
```html
<router-link to="/path">
  <a>Link</a>
</router-link>
```

## Browser support
Runway is tested against the latest version of Chrome, Firefox and Edge.

## Contributing

### Development
To start a development environment, run:
```console
yarn run dev
```
This starts a headless Chrome instance that will continually run tests.

### Build
To build the project, run:
```console
yarn run build
```
This creates the distribution files in the `dist/` directory.

### Test
To test the project, run:
```console
yarn run test
```
This starts a Chrome, Firefox and Edge instance that will run all the tests once per browser.

### Example
To see an example of Runway in use, run:
```console
yarn run example
```
This creates a local server on http://localhost:1234 that serves a demo application.
The application source code can be seen in the `example/` directory.