'use strict';

/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 * @param {function(Object?, string?)} [cb] - optional callback (error, jsonString);
 *   if omitted, returns a Promise<string>
 * @return {void|Promise<string>}
 */
function exportToJsonString(idbDatabase, cb) {
  if (typeof cb !== 'function') {
    return new Promise(function(resolve, reject) {
      exportToJsonString(idbDatabase, function(err, result) {
        if (err) reject(err); else resolve(result);
      });
    });
  }

  const exportObject = {};
  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNamesSet.size;
  if (size === 0) {
    cb(null, JSON.stringify(exportObject));
  } else {
    const objectStoreNames = Array.from(objectStoreNamesSet);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readonly',
    );
    transaction.onerror = (event) => cb(event, null);

    objectStoreNames.forEach((storeName) => {
      const allObjects = [];
      transaction.objectStore(storeName).openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          allObjects.push(cursor.value);
          cursor.continue();
        } else {
          exportObject[storeName] = allObjects;
          if (
            objectStoreNames.length ===
            Object.keys(exportObject).length
          ) {
            cb(null, JSON.stringify(exportObject));
          }
        }
      };
    });
  }
}

/**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash.
 *
 * Only object stores that already exist will be imported.
 *
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @param {function(Object)} [cb] - optional callback (error); if omitted, returns a Promise
 * @return {void|Promise<void>}
 */
function importFromJsonString(idbDatabase, jsonString, cb) {
  if (typeof cb !== 'function') {
    return new Promise(function(resolve, reject) {
      importFromJsonString(idbDatabase, jsonString, function(err) {
        if (err) reject(err); else resolve();
      });
    });
  }

  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNamesSet.size;
  if (size === 0) {
    cb(null);
  } else {
    const objectStoreNames = Array.from(objectStoreNamesSet);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readwrite',
    );
    transaction.onerror = (event) => cb(event);

    const importObject = JSON.parse(jsonString);

    // Delete keys present in JSON that are not present in database
    Object.keys(importObject).forEach((storeName)=> {
      if (!objectStoreNames.includes(storeName)) {
        delete importObject[storeName];
      }
    });

    if (Object.keys(importObject).length === 0) {
      // no object stores exist to import for
      cb(null);
    }

    objectStoreNames.forEach((storeName) => {
      let count = 0;

      const aux = Array.from(importObject[storeName] || []);

      if (importObject[storeName] && aux.length > 0) {
        aux.forEach((toAdd) => {
          const request = transaction.objectStore(storeName).add(toAdd);
          request.onsuccess = () => {
            count++;
            if (count === importObject[storeName].length) {
              // added all objects for this store
              delete importObject[storeName];
              if (Object.keys(importObject).length === 0) {
                // added all object stores
                cb(null);
              }
            }
          };
          request.onerror = (event) => cb(event);
        });
      } else {
        if (importObject[storeName]) {
          delete importObject[storeName];
          if (Object.keys(importObject).length === 0) {
            // added all object stores
            cb(null);
          }
        }
      }
    });
  }
}

/**
 * Clears a database of all data.
 *
 * The object stores will still exist but will be empty.
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 * @param {function(Object)} [cb] - optional callback (error); if omitted, returns a Promise
 * @return {void|Promise<void>}
 */
function clearDatabase(idbDatabase, cb) {
  if (typeof cb !== 'function') {
    return new Promise(function(resolve, reject) {
      clearDatabase(idbDatabase, function(err) {
        if (err) reject(err); else resolve();
      });
    });
  }

  const objectStoreNamesSet = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNamesSet.size;
  if (size === 0) {
    cb(null);
  } else {
    const objectStoreNames = Array.from(objectStoreNamesSet);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readwrite',
    );
    transaction.onerror = (event) => cb(event);

    let count = 0;
    objectStoreNames.forEach(function(storeName) {
      transaction.objectStore(storeName).clear().onsuccess = () => {
        count++;
        if (count === size) {
          // cleared all object stores
          cb(null);
        }
      };
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  // We are running on Node.js so need to export the module
  module.exports = {
    exportToJsonString: exportToJsonString,
    importFromJsonString: importFromJsonString,
    clearDatabase: clearDatabase,
  };
}
