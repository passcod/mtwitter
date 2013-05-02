/*global describe, it, beforeEach*/
'use strict';

var _       = require('underscore');
var Twitter = require('../index');
var config  = require('./config').get();

describe('Using client auth', function() {
  var t;
  this.timeout(10000);

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

  it('should be able to serialise the object itself', function(done) {
    t.post('/favorites/create', {id: '317050755691454464'}, function(error) {
      if (!error || error.codes[0] === 139) {
        done();
      } else {
        done(error);
      }
    });
  });
});

describe('Using app-only auth', function() {
  var t;
  this.timeout(10000);

  beforeEach(function() {
    t = new Twitter(_.extend(config, {application_only: true}));
  });

  it('should be able to perform a GET request', function(done) {
    t.get('/application/rate_limit_status', done);
  });

  it('should be able to perform a POST request', function(done) {
    t.post('/favorites/create', 'id=317050755691454464', null, function(error) {
      if (!error || error.codes[0] === 220) {
        done();
      } else {
        done(error);
      }
    });
  });
});

