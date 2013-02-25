Twitter 1.1 client API for NodeJS
=================================

__[mtwitter](https://github.com/passcod/mtwitter)__ is an updated
version of [@AvianFlu](https://github.com/AvianFlu)'s
[ntwitter](https://github.com/AvianFlu/ntwitter), which in turn was
forked from [@jdub](https://github.com/jdub)'s
[node-twitter](https://github.com/jdub/node-twitter), and so on…


## Installation

You can install __mtwitter__ and its dependencies with npm:

``` bash
$ npm install mtwitter
```

but you should really put it in your
[package.json](http://package.json.nodejitsu.com/) and run:

``` bash
$ npm install
```

to install everything.


## Getting started

### Setup API 

The keys listed below can be obtained from
[dev.twitter.com](https://dev.twitter.com) after
[setting up a new App](https://dev.twitter.com/apps/new).

``` javascript
var twitter = require('mtwitter');

var twit = new twitter({
  consumer_key: 'Twitter',
  consumer_secret: 'API',
  access_token_key: 'keys',
  access_token_secret: 'go here'
});
```


### REST API 

Interaction with other parts of Twitter is accomplished through their RESTful API.
The best documentation for this exists at [dev.twitter.com](https://dev.twitter.com).

Convenience methods exist for many of the available methods, but some may be
more up-to-date than others. If your Twitter interaction is very important,
double-check the parameters in the code with Twitter's current documentation.

Note that all functions may be chained:

``` javascript
twit
  .verifyCredentials(function (err, data) {
    console.log(data);
  })
  .updateStatus('Test tweet from mtwitter/' + twitter.VERSION,
    function (err, data) {
      console.log(data);
    }
  );
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
  stream.on('data', function (data) {
    console.log(data);
  });
});
```
        
Here is an example of how to call the 'statuses/filter' method with a bounding
box over San Fransisco and New York City ( see streaming api for more details
on [locations](https://dev.twitter.com/docs/streaming-api/methods#locations) ):

``` javascript
twit.stream('statuses/filter', {'locations':'-122.75,36.8,-121.75,37.8,-74,40,-73,41'}, function(stream) {
  stream.on('data', function (data) {
    console.log(data);
  });
});
```

Here is an example of how to call the 'statuses/filter' method using the track
and delimited request parameter for more details on [Streaming API request
parameters](https://dev.twitter.com/docs/streaming-apis/parameters#delimited):

``` javascript
twit.stream('statuses/filter', {track: ['cool'], delimited: 'length'}, function(stream) {
  stream.on('data', function (data) {
    if( 'number' === typeof( data ) ){
      console.log( data );
    } else {
      console.log( data.text );
    }
  });
});
```

__mtwitter__ also supports user and site streams:

``` javascript
twit.stream('user', {track:'nodejs'}, function(stream) {
  stream.on('data', function (data) {
    console.log(data);
  });
  stream.on('end', function (response) {
    // Handle a disconnection
  });
  stream.on('destroy', function (response) {
    // Handle a 'silent' disconnection from Twitter, no end/error event fired
  });
  // Disconnect stream after five seconds
  setTimeout(stream.destroy, 5000);
});
```

## Community

Forked from @AvianFlu's [seemingly dead
repo](https://github.com/AvianFlu/ntwitter),
with contributions from various PRs.

All contributors are listed in the
[`package.json`](https://github.com/passcod/mtwitter/blob/master/package.json).