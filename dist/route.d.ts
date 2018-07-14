import Path from '@philipahlberg/path';
import { Component, GuardFn, PropertiesFn, Record, Snapshot, CustomElement } from './types';
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
    constructor(record: Record);
    import(): Promise<CustomElement>;
    snapshot(source: Location | URL): Snapshot;
}
