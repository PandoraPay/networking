/**
 * Load Library and run it
 */
if (!global.kernel) require('kernel');

const library  = require("./build/output/build-node").default;

library.app.start();

module.exports = library;