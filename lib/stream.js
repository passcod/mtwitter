'use strict';

var _ = require('underscore');

module.exports = function TwitterStream(rest, options) {
  // ### "Raw" stream
  // Provides a normalised way to use the REST api to connect
  // to any endpoint and streaming the response. Skips the queue
  // by default as rate-limiting and reconnection is handled here.
  var rawStream = function(method, url, params, pipe, opts) {
    return rest.queueRequest(method, url, params, null, _.extend({
      skipQueue: true,
      stream: pipe
    }, options.restOpts, opts));
  };

  this.raw = rawStream;
};
