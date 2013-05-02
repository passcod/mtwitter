'use strict';

var _     = require('underscore');
var http  = require('http');

function HTTPError(error) {
  this.name = 'HTTPError';
  this.statusCode = error.statusCode;
  this.data = error.data;
  this.originalError = error;
  this.message = this.statusCode + ': ' + http.STATUS_CODES[this.statusCode];
}
HTTPError.prototype = new Error();
exports.HTTPError = HTTPError;

function NoCallbackError() {
  this.name = 'NoCallbackError';
  this.message = 'No callback provided';
}
NoCallbackError.prototype = new Error();
exports.NoCallbackError = NoCallbackError;

function ArgumentError(arg, message) {
  this.name = 'ArgumentError';
  this.message = 'The argument ' + arg + ' ' + message;
}
ArgumentError.prototype = new Error();
exports.ArgumentError = ArgumentError;

function ArgumentRequiredError(arg, message) {
  this.name = 'ArgumentRequiredError';
  this.message = 'The argument ' + arg + ' is required';
  if (message) {
    this.message += ' ' + message;
  }
  console.log(this.message);
}
ArgumentRequiredError.prototype = new Error();
exports.ArgumentRequiredError = ArgumentRequiredError;

function TwitterError(errors) {
  this.errors = errors;
  this.name = 'TwitterError';
  this.message = _.pluck(errors, 'message').join(', ');
  this.codes = _.pluck(errors, 'code');
}
TwitterError.prototype = new Error();
exports.TwitterError = TwitterError;

function BearerTokenError(error, message) {
  this.originalError = error;
  this.name = 'BearerTokenError';
  this.message = message;
}
BearerTokenError.prototype = new Error();
exports.BearerTokenError = BearerTokenError;
