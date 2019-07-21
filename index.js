/*\
|*|
|*|  Base64 / binary data / UTF-8 strings utilities (#1)
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
|*|
|*|  Author: madmurphy
|*|
\*/

/* Array of bytes to base64 string decoding */

function b64ToUint6(nChr) {

	return nChr > 64 && nChr < 91 ?
		nChr - 65
		: nChr > 96 && nChr < 123 ?
			nChr - 71
			: nChr > 47 && nChr < 58 ?
				nChr + 4
				: nChr === 43 ?
					62
					: nChr === 47 ?
						63
						:
						0;

}

function base64DecToArr(sBase64, nBlockSize) {

	var
		sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
		nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2, aBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++ , nOutIdx++) {
				aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}

	return aBytes;
}

/* Base64 string to array encoding */

function uint6ToB64(nUint6) {

	return nUint6 < 26 ?
		nUint6 + 65
		: nUint6 < 52 ?
			nUint6 + 71
			: nUint6 < 62 ?
				nUint6 - 4
				: nUint6 === 62 ?
					43
					: nUint6 === 63 ?
						47
						:
						65;

}

function base64EncArr(aBytes) {

	var eqLen = (3 - (aBytes.length % 3)) % 3, sB64Enc = "";

	for (var nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
		nMod3 = nIdx % 3;
		/* Uncomment the following line in order to split the output in lines 76-character long: */
        /*
        if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
        */
		nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
		if (nMod3 === 2 || aBytes.length - nIdx === 1) {
			sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
			nUint24 = 0;
		}
	}

	return eqLen === 0 ?
		sB64Enc
		:
		sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? "=" : "==");

}


/**
 * JSON replacer function handling ArrayBuffer data
 * see also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 *
 * @param {object} key - key for replacer function
 * @param {object} value - value for replacer function
 */
function arrayBufferReplacer(key, value) {
	if (value instanceof ArrayBuffer) {
		return {
			'indexeddb-export-import': true,
			'type': 'ArrayBuffer',
			'data': base64EncArr(new Uint8Array(value))
		};
	}
	return value;
}

/**
 * JSON receiver function handling ArrayBuffer data
 * see also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 *
 * @param {object} key - key for receiver function
 * @param {object} value - value for receiver function
 */
function arrayBufferReceiver(key, value) {
	if (key === '') return value; // return value at top
	if (value['indexeddb-export-import'] === true && value['type'] === 'ArrayBuffer') {
		return base64DecToArr(value['data']).buffer
	}
	return value;
}

/**
 * JSON replacer function wrapper
 * see also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 *
 * @param {object} key - key for replacer function
 * @param {object} value - value for replacer function
 */
function replacer(key, value) {
	return arrayBufferReplacer(key, value)
}

/**
 * JSON receiver function wrapper
 * see also https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 *
 * @param {object} key - key for receiver function
 * @param {object} value - value for receiver function
 */
function receiver(key, value) {
	return arrayBufferReceiver(key, value);
}

/**
 * Export all data from an IndexedDB database
 * @param {IDBDatabase} idbDatabase - to export from
 * @param {function(Object, <string|void>)} cb - callback with signature (error, jsonString)
 */
function exportToJsonString(idbDatabase, cb) {
	var exportObject = {};
	if(idbDatabase.objectStoreNames.length === 0)
		cb(null, JSON.stringify(exportObject));
	else {
		var transaction = idbDatabase.transaction(idbDatabase.objectStoreNames, "readonly");
		transaction.onerror = function(event) {
			cb(event, null);
		};
		Array.from(idbDatabase.objectStoreNames).forEach(function(storeName) {
			var allObjects = [];
			transaction.objectStore(storeName).openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
					allObjects.push(cursor.value);
					cursor.continue();
				} else {
					exportObject[storeName] = allObjects;
					if(idbDatabase.objectStoreNames.length === Object.keys(exportObject).length) {
						cb(null, JSON.stringify(exportObject, replacer));
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
 * @param {IDBDatabase} idbDatabase - to import into
 * @param {string} jsonString - data to import, one key per object store
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function importFromJsonString(idbDatabase, jsonString, cb) {
	var transaction = idbDatabase.transaction(idbDatabase.objectStoreNames, "readwrite");
	transaction.onerror = function(event) {
		cb(event);
	};
	var importObject = JSON.parse(jsonString, receiver);
	Array.from(idbDatabase.objectStoreNames).forEach(function(storeName) {
		var count = 0;
		Array.from(importObject[storeName]).forEach(function(toAdd) {
			var request = transaction.objectStore(storeName).add(toAdd);
			request.onsuccess = function(event) {
					count++;
					if(count === importObject[storeName].length) { // added all objects for this store
						delete importObject[storeName];
						if(Object.keys(importObject).length === 0) // added all object stores
							cb(null);
					}
				}
		});
	});
}

/**
 * Clears a database of all data
 *
 * @param {IDBDatabase} idbDatabase - to delete all data from
 * @param {function(Object)} cb - callback with signature (error), where error is null on success
 */
function clearDatabase(idbDatabase, cb) {
	var transaction = idbDatabase.transaction(idbDatabase.objectStoreNames, "readwrite");
	transaction.onerror = function(event) {
		cb(event);
	};
	var count = 0;
	Array.from(idbDatabase.objectStoreNames).forEach(function(storeName) {
		transaction.objectStore(storeName).clear().onsuccess = function() {
			count++;
			if(count === idbDatabase.objectStoreNames.length) // cleared all object stores
				cb(null);
		};
	});
}