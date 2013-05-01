/*global describe, it, beforeEach*/
'use strict';

var Twitter = require('../index');
var config  = require('./config').get();

describe('#rest', function() {
  var t;
  this.timeout(5000);

  beforeEach(function() {
    t = new Twitter(config);
  });

  it('should be able to perform a GET request', function(done) {
    t.get('/application/rate_limit_status', done);
  });

  it('should be able to perform a POST request', function(done) {
    t.post('/favorites/create', 'id=317050755691454464', null, function(error) {
      if (!error || error.codes[0] === 139) {
        done();
      } else {
        done(error);
      }
    });
  });
});
