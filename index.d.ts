/**
 * Export all data from an IndexedDB database to a JSON string.
 *
 * @param idbDatabase - an open IDBDatabase connection
 * @param cb - optional callback(error, jsonString); omit to receive a Promise
 */
export function exportToJsonString(idbDatabase: IDBDatabase, cb: (error: Event | null, jsonString: string | null) => void): void;
export function exportToJsonString(idbDatabase: IDBDatabase): Promise<string>;

/**
 * Import data from a JSON string into an IndexedDB database.
 * Only object stores that already exist will be imported into.
 *
 * @param idbDatabase - an open IDBDatabase connection
 * @param jsonString - serialised database produced by exportToJsonString
 * @param cb - optional callback(error); omit to receive a Promise
 */
export function importFromJsonString(idbDatabase: IDBDatabase, jsonString: string, cb: (error: Event | null) => void): void;
export function importFromJsonString(idbDatabase: IDBDatabase, jsonString: string): Promise<void>;

/**
 * Clear all data from every object store in the database.
 * The object stores themselves are preserved.
 *
 * @param idbDatabase - an open IDBDatabase connection
 * @param cb - optional callback(error); omit to receive a Promise
 */
export function clearDatabase(idbDatabase: IDBDatabase, cb: (error: Event | null) => void): void;
export function clearDatabase(idbDatabase: IDBDatabase): Promise<void>;
