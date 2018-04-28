import { PopstateListener, NavigationOptions } from './types';
export declare class History {
    onPopstate: PopstateListener;
    constructor(listener: PopstateListener);
    connect(): void;
    disconnect(): void;
    onpop(): void;
    push(path: string, options?: NavigationOptions): void;
    replace(path: string, options?: NavigationOptions): void;
    go(delta: number): void;
}
