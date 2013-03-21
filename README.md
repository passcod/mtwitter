Twitter 1.1 client API for NodeJS
=================================

__[mtwitter][t1]__ is an updated version of [@AvianFlu][t2]'s [ntwitter][t3],
which in turn was forked from [@jdub][t4]'s [node-twitter][t5], and so on…

[t1]: https://github.com/passcod/mtwitter
[t2]: https://github.com/AvianFlu
[t3]: https://github.com/AvianFlu/ntwitter
[t4]: https://github.com/jdub
[t5]: https://github.com/jdub/node-twitter


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
  console.log(data);
  
  // Example: search
  twt.search("test", {count: 100}, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(data);
  });
});
```

### REST API 

Interaction with other parts of Twitter is accomplished through their RESTful API.
The best documentation for this exists at [dev.twitter.com][b3].

[b3]: https://dev.twitter.com

Convenience methods exist for many of the available methods, but some may be
more up-to-date than others. If your Twitter interaction is very important,
double-check the parameters in the code with Twitter's current documentation.

Note that all functions may be chained:

``` javascript
twit.verifyCredentials(function(err, data) {
  console.log(data);
}).updateStatus('Test tweet', function(err, data) {
  console.log(data);
});
```

### Search API 

``` javascript
twit.search('nodejs OR #node', {}, function(err, data) {
  console.log(data);
});
```

### Streaming API 

The stream() callback receives a Stream-like EventEmitter.

Here is an example of how to call the `statuses/sample` method:

``` javascript
twit.stream('statuses/sample', function(stream) {
  stream.on('data', function(data) {
    console.log(data);
  });
});
```
        
Here is an example of how to call the 'statuses/filter' method with a bounding
box over San Fransisco and New York City ( see streaming api for more details
on [locations][b4] ):

[b4]: https://dev.twitter.com/docs/streaming-api/methods#locations

``` javascript
twit.stream(
  'statuses/filter',
  {'locations':'-122.75,36.8,-121.75,37.8,-74,40,-73,41'},
function(stream) {
  stream.on('data', function (data) {
    console.log(data);
  });
});
```

Here is an example of how to call the 'statuses/filter' method using the track
and delimited request parameter for more details on [Streaming API request
parameters](https://dev.twitter.com/docs/streaming-apis/parameters#delimited):

``` javascript
twit.stream(
  'statuses/filter',
  {track: ['cool'], delimited: 'length'},
function(stream) {
  stream.on('data', function (data) {
    if ('number' === typeof data) {
      console.log(data);
    } else {
      console.log(data.text);
    }
  });
});
```

__mtwitter__ also supports user and site streams:

``` javascript
twit.stream('user', {track:'nodejs'}, function(stream) {
  stream.on('data', function(data) {
    console.log(data);
  });
  stream.on('end', function(response) {
    // Handle a disconnection
  });
  stream.on('destroy', function(response) {
    // Handle a 'silent' disconnection from Twitter, no end/error event fired
  });
  // Disconnect stream after five seconds
  setTimeout(stream.destroy, 5000);
});
```

## Community

Forked from @AvianFlu's [inactive repo][c1], with contributions merged in.

All contributors are listed in the
[`package.json`][c2].

[c1]: https://github.com/AvianFlu/ntwitter
[c2]: https://github.com/passcod/mtwitter/blob/master/package.json
