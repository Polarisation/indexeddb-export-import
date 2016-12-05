var _ = require("underscore");

/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idb_db
 * @param {function(Object, string)} cb - callback with signature (error, jsonString)
 */
function exportToJsonString(idb_db, cb) {
	var exportObject = {};
	if(idb_db.objectStoreNames.length == 0)
		cb(null, JSON.stringify(exportObject));
	else {
		var transaction = idb_db.transaction(idb_db.objectStoreNames, "readonly");
		transaction.onerror = function(event) {
			cb(event);
		};
		_.each(idb_db.objectStoreNames, function(storeName) {				
			var allObjects = [];
			transaction.objectStore(storeName).openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					allObjects.push(cursor.value);
					cursor.continue();
				} else {
					exportObject[storeName] = allObjects;
					if(idb_db.objectStoreNames.length == _.keys(exportObject).length) {
						cb(null, JSON.stringify(exportObject));
					}
				}
			};
		});
	}
}

/**
 * Import data from JSON into an IndexedDB database. This does not delete any existing data
 *  from the database, so keys could clash
 * 
 * @param {IDBDatabase} idb_db
 * @param {string} jsonString - data to import, one key per object store
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function importFromJsonString(idb_db, jsonString, cb) {
	var transaction = idb_db.transaction(idb_db.objectStoreNames, "readwrite");
	transaction.onerror = function(event) {
		cb(event);
	}
	var importObject = JSON.parse(jsonString);
	_.each(idb_db.objectStoreNames, function(storeName) {
		let count = 0;
		_.each(importObject[storeName], function(toAdd) {
			var request = transaction.objectStore(storeName).add(toAdd);
			request.onsuccess = function(event) {
					count++;
					if(count == importObject[storeName].length) { // added all objects for this store
						delete importObject[storeName];
						if(_.keys(importObject).length == 0) // added all object stores
							cb(null);
					}
				}
		});
	});
}

/**
 * Clears a database of all data
 * 
 * @param {IDBDatabase} idb_db
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function clearDatabase(idb_db, cb) {
	var transaction = idb_db.transaction(idb_db.objectStoreNames, "readwrite");
	transaction.onerror = function(event) {
		cb(event);
	}
	let count = 0;
	_.each(idb_db.objectStoreNames, function(storeName) {
		transaction.objectStore(storeName).clear().onsuccess = function() {
			count++;
			if(count == idb_db.objectStoreNames.length) // cleared all object stores
				cb(null);
		};
	});
}

module.exports = {
	exportToJsonString : exportToJsonString,
	importFromJsonString : importFromJsonString,
	clearDatabase : clearDatabase
}