# Runway
A modern router for single-page applications that use web components.

## Overview
Runway is heavily inspired by the Vue router, so if you've used that before, you should feel right at home with Runway.
For an in-depth example of using the router, take a look at the example directory (or try it out with `yarn run example`).

### Features
- Familiar API inspired by Vue
- Built for native web components
- Intuitive lazy-loading using `import()`
- Performant and light-weight

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
  Use named parameters (`/:parameter`) to match dynamic values and pass them to the component as properties, or use a wildcard (`**`) to match everything.
- **component?: HTMLElement | Promise<{ default: HTMLElement }> | string**

  The component that should be rendered.
  Use the component's class declaration for eagerly-loaded components, or pass a function that returns a Promise (like `() => import('./component.js`) to lazy-load the component when the route matches the first time.
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

## Contributing

### Development
To start a development environment, run:
```console
yarn run dev
```
This spawns a headless Chrome instance to run tests against.

### Build
To build the project, run:
```console
yarn run build
```
This creates the distribution files in the `dist/` folder.

### Test
To test the project, run:
```console
yarn run test
```
This spawns a Chrome, Firefox and Edge instance to run tests against.

### Example
To see an example of Runway in use, run:
```console
yarn run example
```
This creates a local server on http://localhost:1234 that serves a demo application.
The application source code can be seen in the `example/` directory.