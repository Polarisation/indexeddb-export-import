# Changelog

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


