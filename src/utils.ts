/**
 * Append a leading slash, and remove all excess slashes.
 */
export function normalize(path: string): string {
  return ('/' + path).replace(/[\/]+/g, '/');
}

/**
 * Shorthand for `decodeURIComponent`
 */
export function decode(str: string): string {
  return decodeURIComponent(str);
}
