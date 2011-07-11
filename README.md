Asynchronous Twitter client API for node.js
===========================================

[ntwitter](http://github.com/AvianFlu/ntwitter) is an upgraded version of jdub's [node-twitter](http://github.com/jdub/node-twitter), which in turn was inspired by, and uses some code from, technoweenie's [twitter-node](http://github.com/technoweenie/twitter-node).

## Version 0.2.0

## Installation

You can install ntwitter and its dependencies with npm: `npm install ntwitter`.


## Getting started

This library is, for the most part, the same API as `node-twitter`. Much of the documentation below is straight from `node-twitter` - credit goes to [jdub](http://github.com/jdub) for putting all this together in the first place. 

The most significant API change involves error handling in callbacks.  Callbacks should now look something like this:

     function (err, result) {
       if (err) {return callback(err)}
       // Real code goes here
     }

Where `callback` is the parent function's callback method.  (Or any other function you want to call on error, really.)

### Setup API (stable)

The keys listed below can be obtained from [here](http://dev.twitter.com)

	var twitter = require('ntwitter');
	var twit = new twitter({
		consumer_key: 'STATE YOUR NAME',
		consumer_secret: 'STATE YOUR NAME',
		access_token_key: 'STATE YOUR NAME',
		access_token_secret: 'STATE YOUR NAME'
	});

### Basic OAuth-enticated GET/POST API (stable)

The convenience APIs aren't finished, but you can get started with the basics:

	twit.get('/statuses/show/27593302936.json', {include_entities:true}, function(data) {
		sys.puts(sys.inspect(data));
	});

### REST API (unstable, may change)

Note that all functions may be chained:

	twit
		.verifyCredentials(function (data) {
			sys.puts(sys.inspect(data));
		})
		.updateStatus('Test tweet from ntwitter/' + twitter.VERSION,
			function (data) {
				sys.puts(sys.inspect(data));
			}
		);

### Search API (unstable, may change)

	twit.search('nodejs OR #node', function(data) {
		sys.puts(sys.inspect(data));
	});

### Streaming API (stable)

The stream() callback receives a Stream-like EventEmitter:

	twit.stream('statuses/sample', function(stream) {
		stream.on('data', function (data) {
			sys.puts(sys.inspect(data));
		});
	});

ntwitter also supports user and site streams:

	twit.stream('user', {track:'nodejs'}, function(stream) {
		stream.on('data', function (data) {
			sys.puts(sys.inspect(data));
		});
		// Disconnect stream after five seconds
		setTimeout(stream.destroy, 5000);
	});

## Contributors

- [AvianFlu](http://github.com/AvianFlu) - Upgrades and current support
- [Jeff Waugh](http://github.com/jdub) (primary author)
- [rick](http://github.com/technoweenie) (parser.js and, of course, twitter-node!)

## TODO

- Complete the convenience functions, preferably generated
- Support [recommended reconnection behaviour](http://dev.twitter.com/pages/user_streams_suggestions) for the streaming APIs

