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
  cookie_secret: null,

  urls: {
    appAuth: 'https://api.twitter.com/oauth2/token',
    restBase: 'https://api.twitter.com/1.1'
  }
};
