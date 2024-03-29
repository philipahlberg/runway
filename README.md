# Runway
A modern, framework-agnostic router for building single-page applications with web components.

## Warning
Runway has not reached 1.0 yet, and so the API is unstable. Expect breaking changes between minor versions until 1.0.

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
    path: 'foo',
    component: Component
  }
];

// 3. Create the router
const router = new Router({
  // all paths will be prefixed with `/`
  root: '/',
  routes,
});

// 4. Connect the router to an element
router.connect(document.body);
```
To visit `'/foo'`, you can:

  1) Call `router.push('/foo')` or `router.replace('/foo')`
  2) Click on a `<router-link to="/foo">` element

If you need your route to match a pattern instead of a path, you can use Express-like named parameters in the path:
```js
const router = new Router({
  root: '/',
  routes: [
    {
      path: ':param',
      component: Component
    }
  ],
});
```

When using a named parameter, you can access the value by utilizing the `properties` function option:
```js
const router = new Router({
  root: '/',
  routes: [
    {
      path: ':param',
      component: Component,
      properties: ({ parameters }) => ({
        myProp: parameters.get('param')
      }),
    },
  ],
});
```
In this example, when an instance of `Component` is created, the property `myProp` is set on the instance with the value of the `param` parameter.
If the user visited `/foo`, the value of `parameters.get('param')` would be `foo`.
The `properties` function also receives other key details of the activated route, including a map of the search parameters (the part after the `?`).

A route can also redirect to another path instead of rendering a component:
```js
const router = new Router({
  root: '/',
  routes: [
    {
      path: 'foo',
      redirect: 'bar'
    },
    {
      path: 'bar',
      component: DashboardComponent
    },
  ],
});
```
Then, if the user visits `/foo`, they will automatically be redirected to `/bar` and the corresponding route will be rendered instead.

Routes can be nested inside eachother, so that components are nested when rendered:
```js
const router = new Router({
  root: '/',
  routes: [
    {
      path: 'foo',
      component: ComponentA,
      children: [
        {
          path: 'bar',
          component: ComponentB
        },
      ],
    },
  ],
});
```
When the user visits `/foo/bar`, the components will be rendered like so:
```html
<component-a>
  <component-b>
  </component-b>
</component-a>
```
Note that nested routes should not have a leading slash.

If you need your route to conditionally match based on some external value, use a route guard to determine if it should match:
```js
const router = new Router({
  root: '/',
  routes: [
    {
      path: 'admin',
      component: AdminComponent,
      guard: () => user.isAdmin,
    },
  ],
});
```
This way, the route will be skipped if the guard function returns `false`.

To see more features, take a look at the `/example` directory or try it in action:
```console
npm run example
```

## API
### `class Router`
Exported as `Router` and `default`.
- **constructor(routes: Record[]): Router**

  Creates the router instance.
- **connect(root: HTMLElement): Promise\<void>**

  Connect the router to the DOM. The promise resolves once every component has been loaded and connected.
- **disconnect(): void**

  Disconnect the router from the DOM.
- **push(path: string, options?: NavigationOptions): Promise\<void>**

  Push a new entry onto the history stack. Resolves once every component has been loaded and connected.
- **replace(path: string, options?: NavigationOptions): Promise\<void>**

  Replace the current entry in the history stack.
- **pop(n: number): void**

  Pop the top `n` entries in the history stack.

### `interface NavigationOptions`
- **query?: Record<string, string>**
  The search query that should be appended to the path, expressed as an object mapping keys to values.

- **hash?: string**
  The hash that should be appended to the path.

### `interface RouteOptions`
- **path: string**

  This is the path that the route should match.
  Use named parameters (`/:parameter`) to match dynamic values and pass them to the component as properties, or use a wildcard (`**`) to match anything.
- **component?: HTMLElement**

  The constructor for the component that should be rendered.
- **load?: () => PromiseLike<{ default: HTMLElement }>**

  Use `load` instead of `component` to lazy-load the component when the route matches for the first time.
  Note that the component needs to be the default export of the module when using `import()`.
- **exact?: boolean**

  Whether or not the route should match *exactly*; `{ path: '/', exact: false }` would match any path (because any path begins with `/`) while `{ path: '/' exact: true }` would *only* match '/'.
  By default, the route will match exactly when no child routes are attached, otherwise it will not.
- **redirect?: string**

  If a redirect is provided, the router will change the URL to match it and instead render the routes that match the new URL.
- **slot?: string**

  Render the component in a specific slot.
- **guard?: () => boolean**

  A function that allows selective matching; returning `false` means the route will be skipped when it would otherwise have matched.
- **properties?: (snapshot: Snapshot) => { [key: string]: string }**

  `properties` allows certain route-specific properties to be passed to the component. The snapshot contains information such as the parameters from the route, the matched path, the query and the hash.
- **children?: RouteOptions[]**

  An array of options. The paths of these nested options are appended to the parent option. Given `{ path: '/', children: [{ path: 'abc' }] }`, the path `/abc` would cause both routes to activate while the path `/` would cause only the topmost route to activate.


### `RouterLink`
A custom element that integrates with the `Router` like an `<a>` element. 

#### Properties
All properties synchronize with attributes and vice versa.

- **to: string**
The target pathname. Similar to an `<a>` element's `href` attribute.

- **active: boolean**
Applied if the link's `to` attribute matches the current pathname.

- **exact: boolean**
Decides how to match the current pathname.

If `exact` is true, a link is active if `to` is strictly equal to the pathname.
If `exact` is false, and `to` starts with a `/`, the link is active if the current path starts with `to`.
If `to` does not start with a `/`, the link is active if the current path ends with `to`.

- **disabled: boolean**
If `true`, prevents the link from triggering navigation.

#### Usage
To use the router link, you need to first define it as a custom element:
```js
import { RouterLink } from 'runway';

customElements.define('router-link', RouterLink);
```
Note: you may use any name you like.

Then, you can use it anywhere as a regular HTML element:
```html
<router-link to="/path">
  Link
<router-link>
```
When the location's pathname matches that of the element, it gains an `active` attribute, which is useful for applying styles to match.

You may wrap the element around an `<a>` to make use its' built in capabilities, such as ctrl-click to open in a new tab:
```html
<router-link to="/path">
  <a>Link</a>
<router-link>
```
When used as a wrapper element, the `<router-link>` element will automatically update the `<a>` element's `href` attribute whenever `to` changes.

Optionally, the `<a>` element's `href` attribute may be set statically to mirror the `<router-link>` element's `to` attribute:
```html
<router-link to="/path">
  <a href="/path">Link</a>
<router-link>
```
Then, if JavaScript is disabled, normal navigation may still occur.

## Browser support
Runway is tested against the latest version of Chrome and Firefox.

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
This starts a Chrome and Firefox instance that will run all the tests once per browser.

### Example
To see an example of Runway in use, run:
```console
yarn run example
```
This creates a local server on http://localhost:1234 that serves a demo application.
The application source code can be seen in the `example/` directory.