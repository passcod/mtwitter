// ## Twitter API for Node.JS
// - GitHub: https://github.com/passcod/mtwitter
// - NPM: http://npmjs.org/package/mtwitter
// - Travis CI: https://travis-ci.org/passcod/mtwitter
// - This document: https://passcod.name/mtwitter

module.exports = require('./lib/mtwitter');

// ## mtwitter source documentation
//
// - [mtwitter.js](mtwitter.html) — the main file, does nothing more
//   than handle options, initialise the main object, and bring
//   everything together.
//
// - [defaults.js](defaults.html) — has both the options' defaults
//   and the endpoint URLs. Also parses the `package.json` and
//   provides version and package metadata.
//
// - [errors.js](errors.html) — custom errors for this library.
//
// - [rest.js](rest.html) — the REST API. Handles request scheduling
//   and rate limiting transparently, as well as taking care of making
//   Twitter's configuration (URL lengths and media sizes) available.
//
// - [stream.js](stream.html) — the Stream API. Currently only provides
//   simple "raw" stream access, but should soon handle reconnections
//   and back-off times as per recommendations.
