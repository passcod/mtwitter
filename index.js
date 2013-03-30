// ## mtwitter source documentation
module.exports = require('./lib/twitter');

// - [twitter.js](twitter.html) — the main file, does nothing more
//   than handle options, initialise the main object, and bring
//   everything together.
//
// - [defaults.js](defaults.html) — has both the options' defaults
//   and the endpoint URLs. Also parses the `package.json` and
//   provides version and package metadata.
//
// - [utils.js](utils.html) — various utilities.
//
// - [errors.js](errors.html) — custom errors for this library.
//
// - [rest.js](rest.html) — the REST API. Handles request scheduling
//   and rate limiting transparently, as well as taking care of making
//   Twitter's configuration (URL lengths and media sizes) available.
//
// - [parser.js](parser.html) — streaming Twitter JSON parser.