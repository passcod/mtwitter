'use strict';

//var Cookies       = require('cookies');
var defaults      = require('./defaults');
//var Keygrip       = require('keygrip');
//var querystring   = require('querystring');
//var request       = require('request');
//var streamparser  = require('./parser');
//var util          = require('util');
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
