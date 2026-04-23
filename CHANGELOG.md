# Changelog

## v2.2.0

 - All three functions now support Promise/async-await: omit the callback to receive a Promise
 - Fix: `request.onerror` during import now surfaces errors to the caller instead of logging to console
 - Fix: callback detection uses `typeof cb !== 'function'` to avoid treating `null`/`false` as a missing callback
 - Add TypeScript type definitions (`index.d.ts`)
 - Add `prepublishOnly` script to ensure lint and tests pass before publishing
 - Upgrade dev dependencies: dexie 3→4, fake-indexeddb 3→6, mocha 9→11, eslint 8.2→8.57
 - Replace defunct Travis CI and CircleCI configs with GitHub Actions (Node 20/22/24 matrix)
 - Switch from `.npmignore` to `files` allowlist in `package.json`

## v2.1.5

- Fix bug when import JSON is missing keys that are present as object store names (#25).

## v2.1.4

*Bad release - do not use.*

## v2.1.3

- Fix bug when import JSON contains keys that are not present as object store names (#21).
- Updated tests to run on Node.js v12 (current maintenance LTS).

## v2.1.2

- Fix possible issue if `objectStoreNames` is `undefined`.

## v2.1.1

 - Handle case where no object stores exist

## v2.1.0

 - Handle cases where there are empty stores or duplicated store names (#16)

## v2.0.3

 - Fix issue (#14) with npm package
 - Update dev dependencies

## v2.0.2

 - Update dev dependencies (fixes potential security vulnerabilities)

## v2.0.1

 - Including extra files in NPM distribution as excluding them impacts quality score
 - README improvements

## v2.0.0

 - Now has no dependencies
 - Reduced package distribution size by 30%
 - Cleaner code
 - Now works in the browser when index.js is imported via `<script>`
 - Now requires ES6 (Node.js 8+ or a modern browser). If you need to support ES5, use a transpiler or stick with v1.x.


