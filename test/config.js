'use strict';

var _ = require('underscore');
var config;

try {
  config = require('../config');
} catch (e) {
  config = {};
  var counter = 4;
  _.each([
    'CONSUMER_KEY',
    'CONSUMER_SECRET',
    'ACCESS_TOKEN_KEY',
    'ACCESS_TOKEN_SECRET'
  ], function(e) {
    if (_.has(process.env, 'TWITTER_' + e)) {
      config[e.toLowerCase()] = process.env['TWITTER_' + e];
      counter -= 1;
    }
  });
  if (counter !== 0) {
    config = false;
  }
}

exports.get = function() {
  if (!config) {
    console.error('No config, abort.');
    console.error('Assuming we’re in a PR, so exiting with 0');
    process.exit();
  }

  return config;
};