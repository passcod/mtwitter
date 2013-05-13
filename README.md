Twitter API for Node.JS
========================

[![Build Status](https://travis-ci.org/passcod/mtwitter.png)](https://travis-ci.org/passcod/mtwitter)
[![NPM version](https://badge.fury.io/js/mtwitter.png)](http://npmjs.org/package/mtwitter)
[![Dependency Status](https://gemnasium.com/passcod/mtwitter.png)](https://gemnasium.com/passcod/mtwitter)


[NPM][i2] & Versioning
----------------------

_Latest stable: 1.4.6_

Use a [package.json][i1]. Yes, even if you're not making a redistributable
yourself. It's just good practice. Specify the version number exactly or to
`1.N.x` where `N` is an _even_ number. 

[i1]: http://package.json.nodejitsu.com/
[i2]: http://npmjs.org/package/mtwitter

__mtwitter__ uses a version numbering scheme similar to that of Node: the major
version number unchanging unless something big happens, and the minor number
defining the version. Also, _odd_ minors are _unstable_, meaning that the API
can change betweeen patch levels, and _even_ minors are _stable_, meaning that
the API will not change until the next minor (i.e. patch levels are bug and
performance fixes only). Examples:

 - 1.0.3 == _Stable_ release, 3rd bugfix.
 - 1.3.0 == _Unstable_ release.
 - 1.3.5 == _Unstable_ release, may have breakage.
 - 1.4.0 == _Stable_ release.

The latest (often unstable) version can always be found at
the [NPM page for the package][i2]. The latest stable is found above.


Instantiation & Keys
--------------------

__mtwitter__ cannot currently help with obtaining access tokens from Twitter,
you'll have to do this yourself. For testing and simple apps, the keys can be
obtained from [dev.twitter.com][b1] after [setting up a new App][b2].

[b1]: https://dev.twitter.com
[b2]: https://dev.twitter.com/apps/new

``` javascript
var Twitter = require('mtwitter');
```

### Normal (client) authentication

``` javascript
var twitter = new Twitter({
  consumer_key: 'Twitter',
  consumer_secret: 'API',
  access_token_key: 'keys',
  access_token_secret: 'go here'
});
```

### App-only authentication

``` javascript
var twitter = new Twitter({
  consumer_key: config.key,
  consumer_secret: config.secret,
  application_only: true
});
```


REST Interface
--------------

The REST interface is fully managed, which means it (will) transparently handles
rate-limiting (in a more intelligent fashion than just waiting 15 minutes
when an HTTP 429 is hit), and also takes care of fetching and refreshing
configuration data as recommended by Twitter.

### Synopsis

``` javascript
twitter.get(
  '/statuses/mentions_timeline',
  {key: 'value'},
function logResponse(error, data, response) {
  console.log('Error? ', error);
  console.log('Parsed object of data: ', data);
  console.log('Raw HTTP response: ', response);
});

twitter.post(
  '/favorites/create',      // URL. Don't use https:// ones
  'id=317050755691454464',  // Body content (can be a string or hashmap)
                            // Content-Type (omit to use default)
  function() { ... }        // Callback has the same signature as above
);
```


### Additional examples

``` javascript
// Get a user's timeline
twit.get('statuses/home_timeline', {screen_name: '_matthewpalmer'}, function(err, item) {
  console.log(err, item);
 });

// Search for a phrase
twit.get('search/tweets', {q: 'node.js'}, function(err, item) {
  console.log(err, item);
});

// Post a new status
var content = {status: 'Maybe he\'ll finally find his keys. /@peterfalk'};
twit.post('statuses/update', content, function(err, item) {
  console.log(err, item);
});
```


Community & Contributions
-------------------------

Originally forked from @AvianFlu's [inactive repo][c1],
but reworked heavily, taking inspiration from many people
and their attempts at making it better. Old (pre-rewrite)
contributors can be found in `HISTORICAL`. Contributors to
the present iteration can be found in the [`package.json`][c2].

License: Public Domain or [CC0][c0].  
Style guide: [passcod/node-style-guide][c3].  
IRC Channel: __#mtwitter__ on [Freenode][c4].

### Contributing

_See `CONTRIBUTING.md` for details_

 - Topical branches and standard PR etiquette is preferred.
 - You need to formally agree to release your contribution.
 - Both linting and testing should pass (the Travis build will fail
   a PR if there are linting errors):

   ``` bash
   $ npm test
   $ npm run-script lint
   ```

[c0]: https://creativecommons.org/publicdomain/zero/1.0
[c1]: https://github.com/AvianFlu/ntwitter
[c2]: https://github.com/passcod/mtwitter/blob/master/package.json
[c3]: https://github.com/passcod/node-style-guide
[c4]: https://freenode.net