/*global describe, it*/
'use strict';

//var assert = require('assert');
var Twitter = require('../index');
var config = require('./config').get();


var req = {
  get: '/application/rate_limit_status.json',
  post: {
    url: '/favorites/create.json',
    content: 'id=317050755691454464'
  }
};

describe('rest.js', function() {
  var t = new Twitter(config);
  this.timeout(5000);

  it('should be able to perform a GET request', function(done) {
    t.get(req.get, done);
    t.rest.drainPool();
  });

  it('should be able to perform a POST request', function(done) {
    t.post(req.post.url, req.post.content, null, function(error) {
      if (error.codes[0] === 139) {
        done();
      } else {
        done(error);
      }
    });
    t.rest.drainPool();
  });
});
