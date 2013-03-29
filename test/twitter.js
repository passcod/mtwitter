/*global describe, it*/
'use strict';

var assert = require('assert');
var Twitter = require('mtwitter');
var config = require('../config');

describe('Twitter', function() {
  it('should be a function', function() {
    assert.equal(typeof Twitter, 'function');
  });

  it('should be a contructor', function() {
    var t = new Twitter(config);
    assert.equal(typeof t, 'object');
  });
});

describe('An instance of Twitter', function() {
  var t = new Twitter(config);

  it('should have .get', function() {
    assert.equal(typeof t.get, 'function');
  });

  it('should have .post', function() {
    assert.equal(typeof t.post, 'function');
  });

  it('should have .rest (DEBUG)', function() {
    assert.equal(typeof t.rest, 'object');
  });

  it('should have .options', function() {
    assert.equal(typeof t.rest, 'object');
  });
});
