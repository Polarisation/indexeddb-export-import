var fakeIndexedDB = require('fake-indexeddb');
var Dexie = require("dexie");
var IDBExportImport = require("../index");
var assert = require("assert");

/* eslint-env mocha */

describe("IDBExportImport", function() {
	describe("#exportToJsonString()", function() {
		it("DB with no object stores should export an empty string", function(done) {
			var db = new Dexie("NoObjectStoresDB", { indexedDB: fakeIndexedDB });
			db.version(1).stores({}); // nothing
			db.open().then(function() {
				var idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
				IDBExportImport.exportToJsonString(idb_db, function(err, jsonString) {
					assert.ifError(err);
					assert.equal(jsonString, "{}");
					done();
				});
			}).catch(function(e) {
				console.error("Could not connect. " + e);
			});
		});

		it("DB with empty object stores should export an empty string", function(done) {
			var db = new Dexie("EmptyObjectStoresDB", { indexedDB: fakeIndexedDB });
			db.version(1).stores({ things : "id++, thing_name, thing_description" }); // nothing
			db.open().then(function() {
				var idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
				IDBExportImport.exportToJsonString(idb_db, function(err, jsonString) {
					assert.ifError(err);
					assert.equal(jsonString, "{\"things\":[]}");
					done();
				});
			}).catch(function(e) {
				console.error("Could not connect. " + e);
			});
		});
	});

	it("Should export, clear, and import the database", function(done) {
		var db = new Dexie("MyDB", { indexedDB: fakeIndexedDB });
		db.version(1).stores({
			things : "id++, thing_name, thing_description"
		});
		db.open().catch(function(e) {
			console.error("Could not connect. " + e);
		});

		var thingsToAdd = [{thing_name : "First thing", thing_description: "This is the first thing"},
												{thing_name : "Second thing", thing_description: "This is the second thing"}];
		db.things.bulkAdd(thingsToAdd).then(function() {
			var idb_db = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

			// export to JSON, clear database, and import from JSON
			IDBExportImport.exportToJsonString(idb_db, function(err, jsonString) {
				assert.ifError(err);
				console.log("Exported as JSON: " + jsonString);
				assert.equal(jsonString, '{"things":['
					+ '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},'
					+ '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');

				IDBExportImport.clearDatabase(idb_db, function(err) {
					assert.ifError(err);
					console.log("Cleared the database");

					IDBExportImport.importFromJsonString(idb_db, jsonString, function(err) {
						assert.ifError(err);
						console.log("Imported data successfully");

						IDBExportImport.exportToJsonString(idb_db, function(err, jsonString) {
							assert.ifError(err);
							console.log("Exported as JSON: " + jsonString);
							assert.equal(jsonString, '{"things":['
								+ '{"thing_name":"First thing","thing_description":"This is the first thing","id":1}'
								+ ',{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');

							done();
						});
					});
				});
			});

		}).catch(Dexie.BulkError, function(e) {
			assert.ifError(e);
		});
	});
});
