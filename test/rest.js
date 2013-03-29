/*global describe, it*/
'use strict';

//var assert = require('assert');
var Twitter = require('mtwitter');
var config = require('../config');

var req = {
  get: '/application/rate_limit_status.json',
  post: {
    url: '/favorites/create.json',
    content: 'id=317050755691454464'
  }
};

describe('rest.js', function() {
  var t = new Twitter(config);

  it('should be able to perform a GET request', function(done) {
    t.get(req.get, done);
    t.rest.drainPool();
  });

  it.skip('should be able to perform a POST request', function(done) {
    t.post(req.post.url, req.post.content, null, function(error) {
      console.log(error);
      console.log(error.originalError.response.req);
      done(error);
    });
    t.rest.drainPool();
  });
});
