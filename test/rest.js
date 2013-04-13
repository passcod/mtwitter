/*global describe, it, beforeEach*/
'use strict';

var Twitter = require('../index');
var config  = require('./config').get();

describe('#rest', function() {
  var t;
  this.timeout(5000);

  beforeEach(function() {
    t = new Twitter(config);
    t.rest.state.scheduling.main.interval = 1000;
  });

  it('should be able to perform a GET request', function(done) {
    t.get('/application/rate_limit_status', done);
    t.rest.drain();
    // This is currently necessary for the requests to run
    // successfully, although I have no idea why. _It just
    // doesn't make sense._ I shall have to investigate.
  });

  it('should be able to perform a POST request', function(done) {
    t.post('/favorites/create', 'id=317050755691454464', null, function(error) {
      if (!error || error.codes[0] === 139) {
        done();
      } else {
        done(error);
      }
    });
    t.rest.drain();
  });
});
