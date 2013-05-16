'use strict';

var _         = require('underscore');
var defaults  = require('./defaults');

module.exports = function Twitter(options) {
  // Force constructing an instance, even if
  // called differently.
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

  // Options come from two sources: the [defaults.js](defaults.html)
  // which has both defaults and endpoint URLs, and the `options`
  // argument to this function.
  this.options = _.extend(defaults.options, options);

  // Initialise the REST API. See [rest.js](rest.html).
  var rest = new (require('./rest'))(this.options);
  this.rest = rest;

  // ## Convenience functions over rest.queueRequest().
  //
  // `params` is _optional_ here.
  this.get = function(url, params, callback) {
    return rest.queueRequest('GET', url, params, callback);
  };

  // `contentType` is _required_ here, but may be set to a falsy
  // value to pick the default: (`application/x-www-form-urlencoded`)
  this.post = function(url, content, contentType, callback) {
    if (typeof contentType === 'function') {
      callback = contentType;
      contentType = null;
    }

    return rest.queueRequest('POST', url, {
      content: content,
      contentType: contentType
    }, callback);
  };

  // Initialise the Stream API. See [stream.js](stream.html).
  var stream = new (require('./stream'))(this.rest, this.options);
  this.stream = stream;
};
