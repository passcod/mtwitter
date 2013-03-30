/*global describe, it, beforeEach*/
'use strict';

var _       = require('underscore');
var assert  = require('assert');
var Twitter = require('../index');
var config  = require('./config').get();


var req = {
  get: '/application/rate_limit_status',
  post: {
    url: '/favorites/create',
    content: 'id=317050755691454464'
  }
};

describe('#rest', function() {
  var t;
  this.timeout(5000);

  beforeEach(function() {
    t = new Twitter(config);
  });

  it('should be able to perform a GET request', function(done) {
    t.get(req.get, done);
  });

  it('should be able to perform a POST request', function(done) {
    t.post(req.post.url, req.post.content, null, function(error) {
      if (!error || error.codes[0] === 139) {
        done();
      } else {
        done(error);
      }
    });
  });

  it('should have retrieve Twitter’s configuration', function(done) {
    t.get(req.get, function(error) {
      if (error) {
        done(error);
      } else {
        assert(!_.isEmpty(t.rest.state.config));
        done();
      }
    });
  });
});
