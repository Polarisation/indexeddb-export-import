'use strict';

/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 * @param {function(Object?, string?)} cb - callback with signature (error, jsonString)
 */
function exportToJsonString(idbDatabase, cb) {
  const exportObject = {};
  let objectStoreNames = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNames.size;
  if (size === 0) {
    return cb(null, JSON.stringify(exportObject));
  } else {
    objectStoreNames = Array.from(objectStoreNames);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readonly'
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
            return cb(null, JSON.stringify(exportObject));
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
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 * @return {void}
 */
function importFromJsonString(idbDatabase, jsonString, cb) {
  let objectStoreNames = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNames.size;
  if (size === 0) {
    cb(null);
  } else {
    objectStoreNames = Array.from(objectStoreNames);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readwrite'
    );
    transaction.onerror = (event) => cb(event);

    const importObject = JSON.parse(jsonString);
    objectStoreNames.forEach((storeName) => {
      let count = 0;
      const aux = Array.from(importObject[storeName]);
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
          request.onerror = (event) => {
            console.log(event);
          };
        });
      } else {
        delete importObject[storeName];
        if (Object.keys(importObject).length === 0) {
          // added all object stores
          cb(null);
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
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 * @return {void}
 */
function clearDatabase(idbDatabase, cb) {
  let objectStoreNames = new Set(idbDatabase.objectStoreNames);
  const size = objectStoreNames.size;
  if (size === 0) {
    cb(null);
  } else {
    objectStoreNames = Array.from(objectStoreNames);
    const transaction = idbDatabase.transaction(
        objectStoreNames,
        'readwrite'
    );
    transaction.onerror = (event) => cb(event);

    let count = 0;
    objectStoreNames.forEach(function (storeName) {
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
