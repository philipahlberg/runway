import { Route } from "./Route";
import {
	decode,
	pushState,
	replaceState,
	popState,
	encodeQuery,
	join,
} from "./utils";
import {
	RouterOptions,
	Component,
	SearchResult,
	NavigationOptions,
} from "./types";

export class Router extends EventTarget {
	public isConnected: boolean;
	private routes: Route[];
	private elements: HTMLElement[];
	private activeRoutes: Route[];
	private rootElement?: HTMLElement;
	private _root: string;

	public constructor(options: RouterOptions) {
		super();
		this.isConnected = false;
		this.elements = [];
		this.activeRoutes = [];
		this._root = options.root;
		this.routes = options.routes.map(
			(option): Route => Route.createPrefixedRoute(option, options.root),
		);
		this.onPopstate = this.onPopstate.bind(this);
	}

	public root(): string {
		return this._root;
	}

	/**
	 * Connect the router to an element.
	 * This checks the current location for matching,
	 * and renders those matched elements.
	 */
	public async connect(rootElement: HTMLElement): Promise<void> {
		window.addEventListener("popstate", this.onPopstate);
		this.isConnected = true;
		this.rootElement = rootElement;
		const to = location.pathname.replace(this.root().substring(1), "");
		const decoded = decode(to);
		const { routes, path } = this.match(decoded);
		const url = new URL(location.toString());
		replaceState({
			path,
			search: url.search.substring(1),
			hash: url.hash.substring(1),
		});
		await this.render(routes);
		this.emit("change");
	}

	/**
	 * Disconnect the router from it's current rootElement element.
	 * This removes all the elements currently rendered, and
	 * removes all listeners, effectively leaving the router inactive.
	 */
	public disconnect(): void {
		window.removeEventListener("popstate", this.onPopstate);
		this.isConnected = false;
		this.activeRoutes = [];
		this.rootElement = undefined;
		this.teardown();
	}

	/**
	 * Push a history entry onto the stack.
	 */
	public async push(
		to: string,
		options: NavigationOptions = {},
	): Promise<void> {
		const decoded = decode(to);
		const { routes, path } = this.match(decoded);
		pushState({
			path,
			search: encodeQuery(options.query ?? {}),
			hash: options.hash ?? "",
		});
		await this.render(routes);
		this.emit("change");
	}

	/**
	 * Replace the topmost entry in the history stack.
	 */
	public async replace(
		to: string,
		options: NavigationOptions = {},
	): Promise<void> {
		const decoded = decode(to);
		const { routes, path } = this.match(decoded);
		replaceState({
			path,
			search: encodeQuery(options.query ?? {}),
			hash: options.hash ?? "",
		});
		await this.render(routes);
		this.emit("change");
	}

	/**
	 * Pop the top `n` entries off of history stack.
	 */
	public pop(n: number = 1): void {
		// triggers a popstate event, so rendering
		// happens in this.onPopstate.
		popState(n);
	}

	private onPopstate(): void {
		const to = location.pathname.replace(this.root().substring(1), "");
		const { routes, path } = this.match(to);
		// TODO: is this ever true?
		if (to !== path) {
			replaceState({
				path,
				search: "",
				hash: "",
			});
		}
		this.render(routes);
		this.emit("change");
	}

	private search(
		path: string,
		candidates: Route[],
		routes: Route[],
	): SearchResult {
		const route = candidates.find((r): boolean => r.matches(path) && r.guard());

		if (route !== undefined) {
			routes.push(route);
			if (route.redirect !== undefined) {
				// transfer any matched parameters
				const from = route.matched(path);
				const to = route.redirect;
				const redirected = route.transfer(from, to);
				// and start over
				return this.search(redirected, this.routes, []);
			} else if (route.children) {
				// Search through the children
				return this.search(path, route.children, routes);
			} else {
				return { routes, path };
			}
		} else {
			// End the search here
			return { routes, path };
		}
	}

	/**
	 * Search for the elements that would match the given path.
	 * If a redirect is encountered, it will be followed.
	 * The resulting path and the matched elements are returned.
	 */
	private match(path: string): SearchResult {
		return this.search(join(this.root(), path), this.routes, []);
	}

	/**
	 * Render the given routes.
	 * The routes are assumed to be nested.
	 */
	private async render(matchedRoutes: Route[]): Promise<void> {
		if (this.rootElement == null) {
			return;
		}

		// Importing early, but deliberately not awaiting
		const imports = matchedRoutes.map((route) => route.import());
		const load = Promise.all(imports);

		// Find the index at which the matched routes
		// differ from the active routes.
		let startIndex;
		const activeRoutes = this.activeRoutes;
		const length = Math.min(matchedRoutes.length, activeRoutes.length);
		for (startIndex = 0; startIndex < length; startIndex++) {
			if (matchedRoutes[startIndex] !== activeRoutes[startIndex]) break;
		}

		this.activeRoutes = matchedRoutes;

		// Remove the obsolete elements from the DOM
		const removals = this.elements.slice(startIndex);
		while (removals.length > 0) {
			const element = removals.pop();
			if (element !== undefined) {
				element.parentElement?.removeChild(element);
			}
		}

		// Discard references to the removed elements
		this.elements = this.elements.slice(0, startIndex);

		// Wait for any asynchronous components to load
		const components = await load;
		// Create the new elements
		const additions = components
			.slice(startIndex)
			.map((Comp: Component) => new Comp());

		this.elements = this.elements.concat(additions);

		// Add slot attributes if needed
		for (let i = startIndex; i < this.elements.length; i++) {
			const element = this.elements[i];
			const route = this.activeRoutes[i];
			if (route.slot) {
				element.setAttribute("slot", route.slot);
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
			} else {
				// No reuse
				this.rootElement.appendChild(this.elements[0]);
			}
		}
	}

	/**
	 * Update all `:param` bindings and `properties` functions in the tree.
	 */
	private updateProperties(): void {
		for (let i = 0; i < this.elements.length; i++) {
			const element = this.elements[i];
			const route = this.activeRoutes[i];
			const snapshot = route.snapshot(window.location);
			if (route.properties != null) {
				const properties = route.properties(snapshot);
				Object.assign(element, properties);
			}
		}
	}

	/**
	 * Remove all currently active elements.
	 */
	private teardown(): void {
		while (this.elements.length > 0) {
			const element = this.elements.pop();
			if (element?.parentElement != null) {
				element.parentElement.removeChild(element);
			}
		}
	}

	private emit(type: string): void {
		this.dispatchEvent(new Event(type));
	}
}
