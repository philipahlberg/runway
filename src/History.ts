import { EventEmitter } from './EventEmitter';
import { NavigationOptions } from './types';
import { decode } from './utils';

const h = history;

export class History extends EventEmitter {
  constructor() {
    super();
    this.onPopstate = this.onPopstate.bind(this);
  }

  connect() {
    window.addEventListener('popstate', this.onPopstate);
  }

  disconnect() {
    window.removeEventListener('popstate', this.onPopstate);
  }

  onPopstate() {
    const path = decode(location.pathname);
    this.emit('popstate', { path });
  }

  push(path: string, options: NavigationOptions = {}) {
    const { data, title } = options;
    h.pushState(data, title || document.title, path);
    this.emit('pushstate', { path });
  }

  replace(path: string, options: NavigationOptions = {}) {
    const { data, title } = options;
    h.replaceState(data, title || document.title, path);
    this.emit('replacestate', { path });
  }

  pop(n: number = 1) {
    h.go(-n);
  }
}