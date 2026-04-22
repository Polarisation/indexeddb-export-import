/* eslint-disable max-len */
const {IDBFactory} = require('fake-indexeddb');
const fakeIndexedDB = new IDBFactory();
const Dexie = require('dexie');
const IDBExportImport = require('../index');
const assert = require('assert');

const mock = JSON.stringify(require('./data/example.json'));
const mock2 = JSON.stringify(require('./data/example2.json'));

/* eslint-env mocha */

describe('IDBExportImport', function() {
  describe('#exportToJsonString()', function() {
    it('DB with no object stores should export an empty string', function(done) {
      const db = new Dexie('NoObjectStoresDB', {indexedDB: fakeIndexedDB});
      db.version(1).stores({}); // nothing
      db.open().then(function() {
        const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
        IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
          assert.ifError(err);
          assert.equal(jsonString, '{}');
          done();
        });
      }).catch(function(e) {
        console.error('Could not connect. ' + e);
      });
    });

    it('DB with empty object stores should export an empty string', function(done) {
      const db = new Dexie('EmptyObjectStoresDB', {indexedDB: fakeIndexedDB});
      db.version(1).stores({things: 'id++, thing_name, thing_description'}); // nothing
      db.open().then(function() {
        const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
        IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
          assert.ifError(err);
          assert.equal(jsonString, '{"things":[]}');
          done();
        });
      }).catch(function(e) {
        console.error('Could not connect. ' + e);
      });
    });
  });

  it('Should export, clear, and import the database', function(done) {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    db.open().catch(function(e) {
      console.error('Could not connect. ' + e);
    });

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];
    db.things.bulkAdd(thingsToAdd).then(function() {
      const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper

      // export to JSON, clear database, and import from JSON
      IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
        assert.ifError(err);
        console.log('Exported as JSON: ' + jsonString);
        assert.equal(jsonString, '{"things":[' +
        '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
          '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');

        IDBExportImport.clearDatabase(idbDB, function(err) {
          assert.ifError(err);
          console.log('Cleared the database');

          IDBExportImport.importFromJsonString(idbDB, jsonString, function(err) {
            assert.ifError(err);
            console.log('Imported data successfully');

            IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
              assert.ifError(err);
              console.log('Exported as JSON: ' + jsonString);
              assert.equal(jsonString, '{"things":[' +
               '{"thing_name":"First thing","thing_description":"This is the first thing","id":1}' +
                ',{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}');

              done();
            });
          });
        });
      });
    }).catch(Dexie.BulkError, function(e) {
      assert.ifError(e);
    });
  });
  it('Should ignore keys for stores that do not exist when importing', function(done) {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    db.open().catch(function(e) {
      console.error('Could not connect. ' + e);
    });

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];
    db.things.bulkAdd(thingsToAdd).then(function() {
      const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
      IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
        '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
        '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}', function(err) {
        assert.ifError(err);
        console.log('Imported data successfully');

        IDBExportImport.clearDatabase(idbDB, () => {
          IDBExportImport.importFromJsonString(idbDB, '{"other": [], "things":[' +
            '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
            '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}', function(err) {
            assert.ifError(err);
            console.log('Imported data successfully');
            done();
          });
        });
      });
    }).catch(Dexie.BulkError, function(e) {
      assert.ifError(e);
    });
  });
  it('Should ignore stores that are not present when importing', function(done) {
    const db = new Dexie('MyDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      things: 'id++, thing_name, thing_description',
    });
    db.open().catch(function(e) {
      console.error('Could not connect. ' + e);
    });

    const thingsToAdd = [{thing_name: 'First thing', thing_description: 'This is the first thing'},
      {thing_name: 'Second thing', thing_description: 'This is the second thing'}];
    db.things.bulkAdd(thingsToAdd).then(function() {
      const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
      IDBExportImport.importFromJsonString(idbDB, '{"other":[' +
        '{"thing_name":"First thing","thing_description":"This is the first thing","id":1},' +
        '{"thing_name":"Second thing","thing_description":"This is the second thing","id":2}]}', function(err) {
        assert.ifError(err);
        console.log('Imported data successfully');

        IDBExportImport.clearDatabase(idbDB, () => {
          IDBExportImport.importFromJsonString(idbDB, '{"other": []}', function(err) {
            assert.ifError(err);
            console.log('Imported data successfully');
            done();
          });
        });
      });
    }).catch(Dexie.BulkError, function(e) {
      assert.ifError(e);
    });
  });
  it('Should import and export the database with empty keys', function(done) {
    const db = new Dexie('myDB', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      colors: 'id++, name, info',
      shapes: 'id++, name',
      color_shape: '[shape+color]',
      empty: 'id++',
    });

    db.open().catch(function(e) {
      console.error('Could not connect. ' + e);
    });

    db.transaction('r',
        db.colors,
        db.shapes,
        db.color_shape,
        db.empty,
        () => {
          const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          IDBExportImport.clearDatabase(idbDB, function(err) {
            assert.ifError(err);
            console.log('Cleared the database');
            IDBExportImport.importFromJsonString(idbDB, mock, function(err) {
              assert.ifError(err);
              if (!err) {
                console.log('Imported data successfully');
              }
              done();
            });
          });
        });
  });
  it('Should import and export the database with equal keys', function(done) {
    const db = new Dexie('myDB2', {indexedDB: fakeIndexedDB});
    db.version(1).stores({
      foo: 'bar',
      test: 'foo',
    });
    db.open().catch(function(e) {
      console.error('Could not connect. ' + e);
    });

    db.transaction('r',
        db.foo,
        db.test,
        () => {
          const idbDB = db.backendDB(); // get native IDBDatabase object from Dexie wrapper
          IDBExportImport.clearDatabase(idbDB, function(err) {
            assert.ifError(err);
            console.log('Cleared the database');
            IDBExportImport.importFromJsonString(idbDB, mock2, function(err) {
              assert.ifError(err);
              console.log('Imported data successfully');
              IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
                assert.ifError(err);
                console.log('Exported as JSON: ' + jsonString);
                assert.equal(jsonString, '{"foo":[{"bar":1}],"test":[{"foo":"value"}]}');
                done();
              });
            });
          });
        });
  });
  it('Should not error if no object stores exist', function(done) {
    const idbDB = fakeIndexedDB; // get native IDBDatabase object from Dexie wrapper
    IDBExportImport.clearDatabase(idbDB, function(err) {
      assert.ifError(err);
      console.log('Cleared the database (nothing happened, no object stores exist)');
      IDBExportImport.importFromJsonString(idbDB, mock2, function(err) {
        assert.ifError(err);
        console.log('Imported data successfully (nothing imported as no object stores exist');
        IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
          assert.ifError(err);
          console.log('Exported as JSON: ' + jsonString);
          assert.equal(jsonString, '{}');
          done();
        });
      });
    });
  });
  it('Should not error if objectStoreNames undefined', function(done) {
    const idbDB = fakeIndexedDB; // get native IDBDatabase object from Dexie wrapper
    idbDB.objectStoreNames = undefined;
    IDBExportImport.clearDatabase(idbDB, function(err) {
      assert.ifError(err);
      console.log('Cleared the database (nothing happened, no object stores exist)');
      IDBExportImport.importFromJsonString(idbDB, mock2, function(err) {
        assert.ifError(err);
        console.log('Imported data successfully (nothing imported as no object stores exist');
        IDBExportImport.exportToJsonString(idbDB, function(err, jsonString) {
          assert.ifError(err);
          console.log('Exported as JSON: ' + jsonString);
          assert.equal(jsonString, '{}');
          done();
        });
      });
    });
  });

  describe('Promise API', function() {
    it('exportToJsonString should return a Promise when no callback given', async function() {
      const db = new Dexie('PromiseExportDB', {indexedDB: new IDBFactory()});
      db.version(1).stores({items: 'id++'});
      await db.open();
      const idbDB = db.backendDB();
      const jsonString = await IDBExportImport.exportToJsonString(idbDB);
      assert.equal(jsonString, '{"items":[]}');
      db.close();
    });

    it('clearDatabase should return a Promise when no callback given', async function() {
      const db = new Dexie('PromiseClearDB', {indexedDB: new IDBFactory()});
      db.version(1).stores({items: 'id++'});
      await db.open();
      await db.items.add({name: 'test'});
      const idbDB = db.backendDB();
      await IDBExportImport.clearDatabase(idbDB);
      const jsonString = await IDBExportImport.exportToJsonString(idbDB);
      assert.equal(jsonString, '{"items":[]}');
      db.close();
    });

    it('importFromJsonString should return a Promise when no callback given', async function() {
      const db = new Dexie('PromiseImportDB', {indexedDB: new IDBFactory()});
      db.version(1).stores({items: 'id++'});
      await db.open();
      const idbDB = db.backendDB();
      await IDBExportImport.importFromJsonString(idbDB, '{"items":[{"id":1,"name":"one"}]}');
      const jsonString = await IDBExportImport.exportToJsonString(idbDB);
      assert.equal(jsonString, '{"items":[{"id":1,"name":"one"}]}');
      db.close();
    });

    it('Should export, clear, and import using async/await', async function() {
      const db = new Dexie('AsyncRoundTripDB', {indexedDB: new IDBFactory()});
      db.version(1).stores({things: 'id++, name'});
      await db.open();
      await db.things.bulkAdd([{name: 'alpha'}, {name: 'beta'}]);
      const idbDB = db.backendDB();

      const exported = await IDBExportImport.exportToJsonString(idbDB);
      await IDBExportImport.clearDatabase(idbDB);
      await IDBExportImport.importFromJsonString(idbDB, exported);
      const reExported = await IDBExportImport.exportToJsonString(idbDB);

      assert.equal(exported, reExported);
      db.close();
    });
  });
});
