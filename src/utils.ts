/**
 * Remove all excess slashes.
 *
 * @param path the path to normalize
 */
export function normalize(path: string): string {
	return path.replace(/[/]+/g, "/");
}

/**
 * Join the given segments as one path.
 *
 * @param segments the segments to be joined
 */
export function join(...segments: string[]): string {
	return normalize(segments.join("/"));
}

/**
 * Shorthand for `decodeURIComponent`
 */
export function decode(str: string): string {
	return decodeURIComponent(str);
}

export interface State {
	path: string;
	search: string;
	hash: string;
}

export function pushState(state: State): void {
	const search = state.search.length > 0 ? `?${state.search}` : "";

	const hash = state.hash.length > 0 ? `#${state.hash}` : "";

	history.pushState(null, "", `${state.path}${search}${hash}`);
}

export function replaceState(state: State): void {
	const search = state.search.length > 0 ? `?${state.search}` : "";

	const hash = state.hash.length > 0 ? `#${state.hash}` : "";

	history.replaceState(null, "", `${state.path}${search}${hash}`);
}

export function popState(n: number = 1): void {
	history.go(-n);
}

export function encodeQuery(query: Record<string, string>): string {
	return Object.entries(query)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");
}
