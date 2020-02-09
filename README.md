# indexeddb-export-import - JSON export/import for IndexedDB

During development and testing it may be useful to be able to save and load the contents of an IndexedDB database.

I wrote this as a Node.js module for use with a desktop [https://electron.atom.io/](Electron) app - which has access to both the IndexedDB API and Node.js. But there are no dependencies for distribution, so it should be easy to reuse the functions in a browser environment where Node.js is not available.

[![Build Status](https://travis-ci.org/Polarisation/indexeddb-export-import.svg?branch=master)](https://travis-ci.org/Polarisation/indexeddb-export-import)
[![NPM](https://nodei.co/npm/indexeddb-export-import.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/indexeddb-export-import/)

## Usage

You will need an open [IDBDatabase](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) connection. 

The following example exports a database, clears all object stores, then re-imports the database. It uses [Dexie.js](https://github.com/dfahlander/Dexie.js) to initiate the database, but this is not required.

    const Dexie = require('Dexie');
    const IDBExportImport = require('indexeddb-export-import');
    
    const db = new Dexie('MyDB');
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    db.open().then(function() {
      const idbDatabase = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
    
      // export to JSON, clear database, and import from JSON
      IDBExportImport.exportToJsonString(idbDatabase, function(err, jsonString) {
        if (err) {
          console.error(err);
        } else {
          console.log('Exported as JSON: ' + jsonString);
          IDBExportImport.clearDatabase(idbDatabase, function(err) {
            if (!err) { // cleared data successfully
              IDBExportImport.importFromJsonString(idbDatabase, jsonString, function(err) {
                if (!err) {
                  console.log('Imported data successfully');
                }
              });
            }
          });
        }
      });
    }).catch(function(e) {
      console.error('Could not connect. ' + e);
    });

## API

### exportToJsonString(idbDatabase, cb)
Export all data from an IndexedDB database

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |
| cb | <code>function</code> | callback with signature (error, jsonString) |

<a name="importFromJsonString"></a>

### importFromJsonString(idbDatabase, jsonString, cb)
Import data from JSON into an IndexedDB database. This does not delete any existing data from the database, so keys could clash

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |
| jsonString | <code>string</code> | data to import, one key per object store |
| cb | <code>function</code> | callback with signature (error), where error is null on success |

<a name="clearDatabase"></a>

### clearDatabase(idbDatabase, cb)
Clears a database of all data

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | <code>IDBDatabase</code> |  |
| cb | <code>function</code> | callback with signature (error), where error is null on success |


## Installation

```
$ npm install indexeddb-export-import
```

## License

MIT
