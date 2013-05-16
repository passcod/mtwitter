/*global describe, it*/
'use strict';

var assert = require('assert');
var Twitter = require('../index');
var config = require('./config').get();

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

  it('should have .rest', function() {
    assert.equal(typeof t.rest, 'object');
  });

  describe('.rest', function() {
    it('should have .queueRequest', function() {
      assert.equal(typeof t.rest.queueRequest, 'function');
    });

    it('should have .queue', function() {
      assert.equal(typeof t.rest.queue, 'object');
    });

    it('should have .limits', function() {
      assert.equal(typeof t.rest.limits, 'object');
    });

    it('should have .config', function() {
      assert.equal(typeof t.rest.config, 'object');
    });
  });

  it('should have .get', function() {
    assert.equal(typeof t.get, 'function');
  });

  it('should have .post', function() {
    assert.equal(typeof t.post, 'function');
  });


  it('should have .stream', function() {
    assert.equal(typeof t.stream, 'object');
  });

  describe('.stream', function() {
    it('should have .raw', function() {
      assert.equal(typeof t.stream.raw, 'function');
    });
  });


  it('should have .options', function() {
    assert.equal(typeof t.options, 'object');
  });
});