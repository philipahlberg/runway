import { EventTarget } from 'event-target-shim/dist/event-target-shim.mjs';

try {
  new window.EventTarget();
} catch (error) {
  window.EventTarget = EventTarget;
}
