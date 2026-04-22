# indexeddb-export-import - JSON export/import for IndexedDB

[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) is a client-side database API available in modern browsers and [Electron](https://electron.atom.io/). During development and testing of a web or desktop app which uses IndexedDB, it can be helpful to save, load, or clear the contents of an IndexedDB database — this package provides that capability.

You can use **indexeddb-export-import** in a Node.js environment imported as a module (e.g. for use with an Electron app). You may also use it in a browser environment by simply including via a `<script>` tag.

[![CI](https://github.com/Polarisation/indexeddb-export-import/actions/workflows/ci.yml/badge.svg)](https://github.com/Polarisation/indexeddb-export-import/actions/workflows/ci.yml)
[![NPM](https://nodei.co/npm/indexeddb-export-import.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/indexeddb-export-import/)

## Usage

You will need an open [IDBDatabase](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) connection.

All three functions support both a **Promise/async-await** style (omit the callback) and a traditional **callback** style.

### async/await (recommended)

```js
const Dexie = require('dexie');
const IDBExportImport = require('indexeddb-export-import');

const db = new Dexie('MyDB');
db.version(1).stores({
  things: 'id++, thing_name, thing_description',
});

await db.open();
const idbDatabase = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

try {
  const jsonString = await IDBExportImport.exportToJsonString(idbDatabase);
  console.log('Exported as JSON: ' + jsonString);

  await IDBExportImport.clearDatabase(idbDatabase);
  console.log('Cleared the database');

  await IDBExportImport.importFromJsonString(idbDatabase, jsonString);
  console.log('Imported data successfully');
} catch (err) {
  console.error(err);
}
```

### Callback style

```js
const Dexie = require('dexie');
const IDBExportImport = require('indexeddb-export-import');

const db = new Dexie('MyDB');
db.version(1).stores({
  things: 'id++, thing_name, thing_description',
});
db.open().then(function() {
  const idbDatabase = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

  IDBExportImport.exportToJsonString(idbDatabase, function(err, jsonString) {
    if (err) {
      console.error(err);
    } else {
      console.log('Exported as JSON: ' + jsonString);
      IDBExportImport.clearDatabase(idbDatabase, function(err) {
        if (!err) {
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
```

## API

### exportToJsonString(idbDatabase[, cb])
Export all data from an IndexedDB database.

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | `IDBDatabase` | open database connection |
| cb | `function` | optional callback `(error, jsonString)`; omit to receive a `Promise<string>` |

### importFromJsonString(idbDatabase, jsonString[, cb])
Import data from JSON into an IndexedDB database. This does not delete any existing data from the database, so keys could clash.

Only object stores that already exist will be imported.

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | `IDBDatabase` | open database connection |
| jsonString | `string` | data to import, one key per object store |
| cb | `function` | optional callback `(error)`; omit to receive a `Promise<void>` |

### clearDatabase(idbDatabase[, cb])
Clears a database of all data. The object stores themselves are preserved.

| Param | Type | Description |
| --- | --- | --- |
| idbDatabase | `IDBDatabase` | open database connection |
| cb | `function` | optional callback `(error)`; omit to receive a `Promise<void>` |


## Installation

```
$ npm install indexeddb-export-import
```

## License

MIT
