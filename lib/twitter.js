'use strict';

var defaults      = require('./defaults');
var utils         = require('./utils');

module.exports = function Twitter(options) {
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

  this.options = utils.merge(defaults.options, options, defaults.urls);

  var rest = new (require('./rest'))(this.options);

  this.get = function(url, params, callback) {
    return rest.queueRequest('GET', url, params, callback);
  };

  this.post = function(url, content, contentType, callback) {
    return rest.queueRequest('POST', url, {
      content: content,
      contentType: contentType
    }, callback);
  };

  this.rest = rest;
};
