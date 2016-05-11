
export default class SessionStore {
    constructor(store) {
        this._store = store;
    }

    get store() {
        return this._store;
    }

    setObject(key, value) {
        this._store.setItem(key, JSON.stringify(value));
    }

    getObject(key) {
        const value = this._store.getItem(key);
        return value && JSON.parse(value);
    }
}

