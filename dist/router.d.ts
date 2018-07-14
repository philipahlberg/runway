import { EventEmitter } from './EventEmitter';
import { Route } from './Route';
import { History } from './History';
import { Record, NavigationOptions } from './types';
export interface SearchResult {
    matched: Route[];
    path: string;
}
export declare class Router extends EventEmitter {
    isConnected: boolean;
    history: History;
    routes: Route[];
    elements: HTMLElement[];
    activeRoutes: Route[];
    root?: HTMLElement;
    constructor(records: Record[]);
    /**
     * Connect the router to an element.
     * This checks the current location for matching,
     * and renders those matched elements.
     */
    connect(root: HTMLElement): Promise<void>;
    /**
     * Disconnect the router from it's current root element.
     * This removes all the elements currently rendered, and
     * removes all listeners, effectively leaving the router inactive.
     */
    disconnect(): void;
    private onPopstate(to);
    /**
     * Push a history entry onto the stack.
     */
    push(to: string, options?: NavigationOptions): Promise<void>;
    /**
     * Replace the topmost entry in the history stack.
     */
    replace(to: string, options?: NavigationOptions): Promise<void>;
    /**
     * Pop the top `n` entries off of history stack.
     */
    pop(n?: number): void;
    private search(path, routes, matched);
    /**
     * Search for the elements that would match the given path.
     * If a redirect is encountered, it will be followed.
     * The resulting path and the matched elements are returned.
     */
    private match(path);
    /**
     * Render the given routes.
     * The routes are assumed to be nested.
     */
    private render(matchedRoutes);
    /**
     * Update all `:param` bindings and `properties` functions in the tree.
     */
    private updateProperties();
    /**
     * Remove all currently active elements.
     */
    private teardown();
}
export default Router;
