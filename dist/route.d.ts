import Path from '@philipahlberg/path';
import { Component, GuardFn, PropertiesFn, Record, Snapshot } from './types';
export declare class Route extends Path {
    private static cache;
    path: string;
    exact: boolean;
    component: Component;
    redirect?: string;
    slot?: string;
    guard: GuardFn;
    properties: PropertiesFn;
    children: Route[];
    static import(component: Component): Promise<HTMLElement>;
    constructor(record: Record);
    import(): Promise<HTMLElement>;
    snapshot(source: Location | URL): Snapshot;
}
