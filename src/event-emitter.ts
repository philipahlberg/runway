export type Listener = (detail?: any) => void;

export default class EventEmitter {
  map: Map<string, Set<Listener>>;

  constructor() {
    this.map = new Map();
  }

  on(type: string, listener: Listener) {
    let listeners;
    if (!this.map.has(type)) {
      listeners = new Set();
      this.map.set(type, listeners);
    } else {
      listeners = this.map.get(type);
    }
    listeners!.add(listener);
  }

  off(type: string, listener: Listener) {
    if (!this.map.has(type)) {
      return;
    }

    const listeners = this.map.get(type);
    listeners!.delete(listener);
  }

  emit(type: string, detail?: any) {
    if (!this.map.has(type)) {
      return;
    }

    const listeners = this.map.get(type);
    for (const listener of listeners!) {
      listener(detail);
    }
  }
}