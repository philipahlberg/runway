import { EventEmitter } from './event-emitter';
import { Route } from './route';
import { History } from './history';
import { Record, NavigationOptions } from './types';
export interface SearchResult {
    matched: Route[];
    path: string;
}
export declare class Router extends EventEmitter {
    static instance: Router;
    isConnected: boolean;
    history: History;
    routes: Route[];
    elements: HTMLElement[];
    matched: Route[];
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
    /**
     * @private
     */
    onpop(to: string): void;
    /**
     * Push a history entry onto the stack.
     */
    push(to: string, options?: NavigationOptions): Promise<void>;
    /**
     * Replace the topmost entry in the history stack.
     */
    replace(to: string, options?: NavigationOptions): Promise<void>;
    /**
     * Traverse through the history stack.
     */
    go(entries: number): void;
    /**
     * @private
     */
    search(path: string, routes: Route[], matched: Route[]): SearchResult;
    /**
     * @private
     * Search for the elements that would match the given path.
     * If a redirect is encountered, it will be followed.
     * The resulting path and the matched elements are returned.
     */
    match(path: string): SearchResult;
    /**
     * @private
     * Render the given routes.
     * The routes are assumed to be nested.
     */
    render(matched: Route[]): Promise<void>;
    /**
     * Update all `:param` bindings and `properties` functions in the tree.
     */
    updateProperties(): void;
    /**
     * Remove all currently active elements.
     */
    teardown(): void;
}
export default Router;
