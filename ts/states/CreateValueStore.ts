import { Action, Store, createStore } from "redux";

function createValueStore<T>(): Store<T | null, Action<T | null>>;
function createValueStore<T>(defaultValue: T): Store<T, Action<T>>;
function createValueStore<T>(defaultValue: T | null = null) {
    const store = defaultValue === null
        ? createStore((state: T | null = null, action: Action<T | null>) => action.type)
        : createStore((state: T = defaultValue, action: Action<T>) => action.type);

    store.dispatch({ type: defaultValue });

    return store;
}

export default createValueStore;