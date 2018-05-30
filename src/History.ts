import { PopstateListener, NavigationOptions } from './types';
import { decode } from './utils';

const h = history;

export class History {
  onPopstate: PopstateListener;

  constructor(listener: PopstateListener) {
    this.onPopstate = listener;
    this.onpop = this.onpop.bind(this);
  }

  connect() {
    window.addEventListener('popstate', this.onpop);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onpop);
  }

  onpop() {
    const to = decode(location.pathname);
    this.onPopstate(to);
  }

  push(path: string, options: NavigationOptions = {}) {
    const { data, title } = options;
    h.pushState(data, title, path);
  }

  replace(path: string, options: NavigationOptions = {}) {
    const { data, title } = options;
    h.replaceState(data, title, path);
  }

  go(delta: number) {
    h.go(delta);
  }
}