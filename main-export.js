const library = require( (typeof BROWSER !== "undefined" && BROWSER) ? './../build/output/build-browser' : './build-node' );

module.exports = library;