/**
 * Remove all excess slashes.
 * 
 * @param path the path to normalize
 */
export function normalize(path: string): string {
  return path.replace(/[\/]+/g, '/');
}

/**
 * Join the given segments as one path.
 * 
 * @param segments the segments to be joined
 */
export function join(...segments: string[]): string {
  return normalize(segments.join('/'));
}

/**
 * Shorthand for `decodeURIComponent`
 */
export function decode(str: string): string {
  return decodeURIComponent(str);
}

export function pushState(path: string) {
  history.pushState(null, '', path);
}

export function replaceState(path: string) {
  history.replaceState(null, '', path);
}

export function popState(n: number = 1) {
  history.go(n);
}