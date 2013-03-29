'use strict';

// `pkginfo` exports all values straight out by default.
// We want them namespaced.
var pkginfo = {exports: []};
try {
  require('pkginfo')(pkginfo);
} catch (e) {
  pkginfo.exports = {name: 'mtwitter', version: '0.0.0'};
}
exports.pkginfo = pkginfo.exports;

exports.urls = {
  request_token_url: 'https://api.twitter.com/oauth/request_token',
  access_token_url: 'https://api.twitter.com/oauth/access_token',
  authenticate_url: 'https://api.twitter.com/oauth/authenticate',
  authenticate_application_url: 'https://api.twitter.com/oauth2/token',
  authorize_url: 'https://api.twitter.com/oauth/authorize',
  rest_base: 'https://api.twitter.com/1.1',
  search_base: 'https://api.twitter.com/1.1',
  stream_base: 'https://stream.twitter.com/1.1',
  user_stream_base: 'https://userstream.twitter.com/1.1',
  site_stream_base: 'https://sitestream.twitter.com/1.1'
};

exports.options = {
  consumer_key: null,
  consumer_secret: null,
  access_token_key: null,
  access_token_secret: null,
  application_only: false,

  headers: {
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': exports.pkginfo.name + '/' + exports.pkginfo.version
  },

  secure: false,
  cookie: 'twauth',
  cookie_options: {},
  cookie_secret: null
};
