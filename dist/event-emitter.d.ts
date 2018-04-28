import { EventEmitterListener } from './types';
export declare class EventEmitter {
    map: Map<string, Set<EventEmitterListener>>;
    constructor();
    on(type: string, listener: EventEmitterListener): void;
    off(type: string, listener: EventEmitterListener): void;
    emit(type: string, detail?: any): void;
}
