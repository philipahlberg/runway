import { EventEmitter } from './EventEmitter';
import { NavigationOptions } from './types';
export declare class History extends EventEmitter {
    constructor();
    connect(): void;
    disconnect(): void;
    onPopstate(): void;
    push(path: string, options?: NavigationOptions): void;
    replace(path: string, options?: NavigationOptions): void;
    pop(n?: number): void;
}
