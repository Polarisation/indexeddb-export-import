# JSON export/import for IndexedDB

During development and testing it may be useful to be able to save and load the contents of an IndexedDB database.

I wrote this as a Node.js module for use with a desktop Electron app - which has access to both the IndexedDB API and Node.js. But there are minimal dependencies so it should be easy to reuse the functions in a browser environment where Node.js is not available.

[![NPM](https://nodei.co/npm/indexeddb-export-import.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/indexeddb-export-import/)

## Install

```
$ npm install indexeddb-export-import
```

## Usage

You will need an open [IDBDatabase](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase) connection. 

The example below uses [Dexie.js](https://github.com/dfahlander/Dexie.js), but this is not required.

	var Dexie = require("Dexie");
	var idbExportImport = require("indexeddb-export-import")

	var db = new Dexie("MyDB");
	db.version(1).stores({
		things : "id++, thing_name, thing_description",
	});
	db.open().catch(function(e) {
		console.error("Could not connect. " + e);
	});

	var idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

	// export to JSON, clear database, and import from JSON
	idbExportImport.exportToJson(idb_db, function(err, jsonString) {
		if(err)
			console.error(err);
		else {
			console.log("Exported as JSON: " + jsonString);
			idbExportImport.clearDatabase(idb_db, function(err) {
				if(!err) // cleared data successfully
					idbExportImport.importFromJson(idb_db, jsonString, function(err) {
						if (!err)
							console.log("Imported data successfully");
					}
			});
		}
	});