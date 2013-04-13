mtwitter roadmap
----------------

The last backward-compatible version (i.e. that can be used as a drop-in
replacement for ntwitter) was __1.0.x__. If you do not want breakage, do
specify this in your `package.json`. Version numbers now start at __1.3.x__
and follow Node.js numbering: _odd_ versions are unstable, _even_ versions
are stable. There ___will___ be breakage if you ignore this warning.

For more details into what will go in releases, see the [milestone list][r1].
[r1]: https://github.com/passcod/mtwitter/issues/milestones

[![Build Status](https://travis-ci.org/passcod/mtwitter.png)](https://travis-ci.org/passcod/mtwitter)
[![NPM version](https://badge.fury.io/js/mtwitter.png)](http://badge.fury.io/js/mtwitter)
[![Dependency Status](https://gemnasium.com/passcod/mtwitter.png)](https://gemnasium.com/passcod/mtwitter)

Documentation for the __1.3.x__ release:

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

Twitter API for Node.JS
========================

[![Build Status](https://travis-ci.org/passcod/mtwitter.png)](https://travis-ci.org/passcod/mtwitter)
[![NPM version](https://badge.fury.io/js/mtwitter.png)](http://badge.fury.io/js/mtwitter)
[![Dependency Status](https://gemnasium.com/passcod/mtwitter.png)](https://gemnasium.com/passcod/mtwitter)


## Installation

You can install __mtwitter__ and its dependencies with npm:

``` bash
$ npm install mtwitter
```

but you should really put it in your [package.json][i1] and run:

``` bash
$ npm install
```

to install everything.

[i1]: http://package.json.nodejitsu.com/


## Getting started

### Setup API 

The keys listed below can be obtained from
[dev.twitter.com][b1] after [setting up a new App][b2].

[b1]: https://dev.twitter.com
[b2]: https://dev.twitter.com/apps/new

``` javascript
var twitter = require('mtwitter');

var twit = new twitter({
  consumer_key: 'Twitter',
  consumer_secret: 'API',
  access_token_key: 'keys',
  access_token_secret: 'go here'
});
```

#### App-only Authentication

``` javascript
var twit = new twitter({
  consumer_key: config.key,
  consumer_secret: config.secret,
  application_only: true
});

twit.appAuth(function (err, data) {
  if (err) {
    console.log(err);
    return;
  }
  
  // Ready!
});
```

### REST API 

TBD

## Community

Forked from @AvianFlu's [inactive repo][c1], with contributions merged in.

All contributors are listed in the [`package.json`][c2].

Style guide: [passcod/node-style-guide][c3].

[c1]: https://github.com/AvianFlu/ntwitter
[c2]: https://github.com/passcod/mtwitter/blob/master/package.json
[c3]: https://github.com/passcod/node-style-guide