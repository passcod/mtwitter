'use strict';

var _       = require('underscore');
var errors  = require('./errors');
var Fantail = require('fantail');
var jape    = require('jape');
var request = require('request');

module.exports = function TwitterRest(options) {
  // ### Queue
  // See https://passcod.name/fantail
  var queue = new Fantail();

  // ### Rate limiting
  // Rate limits are kept up-to-date dynamically here.
  var rateLimits = {};

  // ### Twitter configuration
  // Contains the information found at `/help/configuration`.
  // This is requested at startup and every 24 hours
  // after this.
  var upstreamConfig = {};


  // ## Utilities

  // Convert a URL such as `/favorites/create.json`
  // to `POST favorites/create`, by looking it up
  // in the resource list (see near the bottom).
  var resourceFromUrl = function(url, post) {
    post = !!post;

    var result;
    Object.keys(module.exports.resources).forEach(function(resource) {
      resource = resource.split(' ');
      if (result || (post && resource[0] !== 'POST')) {
        return;
      }

      var pattern = new RegExp(resource[1].replace(/\/\//g, '/([^/])/'), 'i');
      if (pattern.test(url)) {
        result = resource.join(' ');
      }
    });
    return result;
  };

  // Valid URLs that are passed in match the regex
  // `^/?[a-zA-Z0-9/_]+(\.json)?$`. We want to have
  // them all in full absolute format, ready to be
  // used in a request.
  var canonizeUrl = function(url) {
    if (url.charAt(0) !== '/') {
      if (/http/i.test(url)) {
        return url;
      }
      url = '/' + url;
    }

    if (!/\.json$/i.test(url)) {
      url += '.json';
    }

    return options.urls.restBase + url;
  };


  // ## Queue a request
  // This is mostly a matter of filtering the input
  // to make sure everything is as expected, and to
  // arrange what input we do let through exactly as
  // we want it.
  var queueRequest = function(method, url, params, callback, opts) {
    var post = /post/i.test(method);

    // The `params` and `opts` arguments are optional,
    // everything else is required. The code below is
    // pretty much self-explanatory.
    if (typeof params === 'function') {
      opts = callback;
      callback = params;
      params = null;
    }

    opts = _.defaults(opts ? opts : {}, {
      headers: {},
      skipQueue: false,
      stream: false
    });

    if (post) {
      if (!params) {
        throw new errors.ArgumentRequiredError('params', 'for POST');
      }

      if (!params.content) {
        throw new errors.ArgumentRequiredError('params.content', 'for POST');
      }

      if (typeof params.content !== 'string') {
        params.content = jape(params.content);
      }

      if (!params.contentType) {
        params.contentType = 'application/x-www-form-urlencoded';
      }
    }

    if (typeof callback !== 'function' && !opts.stream) {
      throw new errors.NoCallbackError();
    }

    var req = {
      post: post,
      url: canonizeUrl(url),
      resource: resourceFromUrl(url, post),
      params: params,
      callback: callback,
      options: opts
    };

    if (opts.skipQueue) {
      // For those requests that shouldn't go through
      // the queue (mostly internals).
      processRequest(req);
    } else {
      queue.push(req);
    }
  };

  // ## Requeue a request
  // If we've hit the rate limit, requeue the
  // request and schedule a targeted drain.
  var requeueRequest = function(req) {
    console.log('Hit rate limit, requeuing.');
    queue.push(req);
  };

  // ## Process a request
  // This is done in three parts: first, the request
  // options are prepared, including any special
  // requirements for authentication and POST;
  // second, the request is checked for rate limiting;
  // and finally, the request is sent and its response
  // is parsed and triaged.
  var processRequest = function(req) {
    var handleResponse = function(error, response) {
      if (!error) {
        try {
          var json = JSON.parse(response.body);
          if (json.errors) {
            throw new errors.TwitterError(json.errors);
          }

          return req.callback(null, json, response);
        } catch (err) {
          error = err;
        }
      } else if (error.statusCode) {
        if (error.statusCode === 429) {
          return requeueRequest(req, response);
        }

        error.response = response;
        error = new errors.HTTPError(error);
      }
      req.callback(error, null, response);
    };

    var method = request.post;
    var headers = {};
    var reqOptions = {
      url: req.url,
      followAllRedirects: true
    };

    if (options.application_only) {
      headers.Authorization = 'Bearer ' + options.bearer_token;
    } else {
      reqOptions.oauth = {
        consumer_key:     options.consumer_key,
        consumer_secret:  options.consumer_secret,
        token:            options.access_token_key,
        token_secret:     options.access_token_secret
      };
    }

    if (req.post) {
      // This header's case is important due to how `request`
      // is coded (badly!) (see mikeal/request#499)
      headers['content-type'] = req.params.contentType;

      var isMultipart = req.params.contentType &&
        req.params.contentType.toLowerCase() === 'multipart/form-data';

      if (isMultipart) {
        reqOptions.multipart = req.params.content;
      } else {
        reqOptions.body = req.params.content;
      }
    } else {
      method = request.get;
      reqOptions.qs = req.params;
    }

    // Headers are overwritten by each subsequent
    // object. The req.options.headers field together
    // with the other arguments can potentially be
    // used to create a completely different request.
    reqOptions.headers = _.extend(
      options.headers,
      headers,
      req.options.headers
    );

    if (req.options.stream) {
      method(reqOptions).pipe(req.options.stream);
    } else {
      method(reqOptions, handleResponse);
    }
  };


  // ## Prerequisites

  // ### Twitter configuration
  // Get the config from /help/configuration. This should
  // be run at startup and every 24 hours after that.
  var getConfig = function(callback) {
    var setConfig = function(error, data) {
      if (!error) {
        upstreamConfig = data;
      }
      if (callback) {
        callback();
      }
    };
    queueRequest(
      'GET',
      '/help/configuration',
      setConfig,
      {skipQueue: !queue.started}
    );
    setTimeout(getConfig, 24 * 60 * 60 * 1000);
  };

  // ### Rate limits
  // Get the latest global rate-limit information.
  var getLimits = function(callback) {
    var setLimits = function(error, data) {
      if (!error) {
        // The twitter response is divided accross "families" of
        // requests. We don't really care for all that.
        _.each(data.resources, function eachFamily(family) {
          _.each(family, function eachResource(resource, limits) {
            resource = resourceFromUrl(resource);
            rateLimits[resource] = limits;
          });
        });
      }
      if (callback) {
        callback();
      }
    };
    queueRequest(
      'GET',
      '/application/rate_limit_status',
      setLimits,
      {skipQueue: !queue.started}
    );
    setTimeout(getLimits, 15 * 60 * 1000);
  };

  // ### Bearer token
  // Get the application-only bearer token if one
  // isn't provided already.
  var getAppOnlyToken = function(callback) {
    var setToken = function(error, data) {
      if (error || !data.token_type || data.token_type !== 'bearer') {
        throw new errors.BearerTokenError(error,
          'Couldn\'t fetch the bearer token');
      }

      options.bearer_token = data.access_token;

      if (callback) {
        callback();
      }
    };

    var auth = [options.consumer_key,options.consumer_secret].join(':');
    auth = 'Basic ' + new Buffer(auth).toString('base64');

    queueRequest(
      'POST',
      options.urls.appAuth,
      {content: 'grant_type=client_credentials'},
      setToken,
      {skipQueue: true, headers: {Authorization: auth}}
    );
  };

  queue.addHandler('process', processRequest);

  // ## Drains
  // Drains schedule requests to be processed.
  // By default we run 5 GET/s and 10 POST/s.

  // ### POST drain
  // Post requests don't have explicit rate limits,
  // so run them all as they come.
  queue.addPicker(function postDrain(req) {
    if (req.post) {
      this.handle('process');
    }
  }, 1000, 10);

  // ### GET drain
  queue.addPicker(function getDrain(req) {
    if (!req.post) {
      // Rate limit screening
      this.handle('process');
    }
  }, 1000, 5);


  var start = function() {
    getConfig(function() {
      if (Object.keys(rateLimits).length > 0) {
        queue.start();
      }
    });
    getLimits(function() {
      if (Object.keys(upstreamConfig).length > 0) {
        queue.start();
      }
    });
  };

  if (options.application_only && !options.bearer_token) {
    getAppOnlyToken(function() {
      start();
    });
  } else {
    start();
  }

  this.queueRequest = queueRequest;
  this.queue = queue;
  this.limits = rateLimits;
  this.config = upstreamConfig;
};


// ## List of all resources
// _Does not include Stream API resources._
//
// See https://dev.twitter.com/docs/api/1.1
module.exports.resources = {
  // ### Statuses
  'GET statuses/mentions_timeline': {
    rateLimits: {user: 15, app: 0}
  },
  'GET statuses/user_timeline': {
    rateLimits: {user: 180, app: 300}
  },
  'GET statuses/home_timeline': {
    rateLimits: {user: 15, app: 0}
  },
  'GET statuses/retweets_of_me': {
    rateLimits: {user: 15, app: 0}
  },
  'GET statuses/retweets/': {
    rateLimits: {user: 15, app: 60}
  },
  'GET statuses/show/': {
    rateLimits: {user: 180, app: 180}
  },
  'POST statuses/destroy/': {
    rateLimits: false
  },
  'POST statuses/update': {
    rateLimits: false
  },
  'POST statuses/retweet/': {
    rateLimits: false
  },
  'POST statuses/update_with_media': {
    rateLimits: false
  },
  'GET statuses/oembed': {
    rateLimits: {user: 180, app: 180}
  },

  // ### Search
  'GET search/tweets': {
    rateLimits: {user: 180, app: 450}
  },

  // ### Direct Messages
  'GET direct_messages': {
    rateLimits: {user: 15, app: 0}
  },
  'GET direct_messages/sent': {
    rateLimits: {user: 15, app: 0}
  },
  'GET direct_messages/show': {
    rateLimits: {user: 15, app: 0}
  },
  'POST direct_messages/destroy': {
    rateLimits: false
  },
  'POST direct_messages/new': {
    rateLimits: false
  },

  // ### Friendships (followers / following)
  'GET friendships/no_retweets/ids': {
    rateLimits: {user: 15, app: 0}
  },
  'GET friends/ids': {
    rateLimits: {user: 15, app: 15}
  },
  'GET followers/ids': {
    rateLimits: {user: 15, app: 15}
  },
  'GET friendships/lookup': {
    rateLimits: {user: 15, app: 0}
  },
  'GET friendships/incoming': {
    rateLimits: {user: 15, app: 0}
  },
  'GET friendships/outgoing': {
    rateLimits: {user: 15, app: 0}
  },
  'POST friendships/create': {
    rateLimits: false
  },
  'POST friendships/destroy': {
    rateLimits: false
  },
  'POST friendships/update': {
    rateLimits: false
  },
  'GET friendships/show': {
    rateLimits: {user: 180, app: 15}
  },
  'GET friends/list': {
    rateLimits: {user: 15, app: 30}
  },
  'GET followers/list': {
    rateLimits: {user: 15, app: 30}
  },

  // ### Account settings
  'GET account/settings': {
    rateLimits: {user: 15, app: 0}
  },
  'GET account/verify_credentials': {
    rateLimits: {user: 15, app: 0}
  },
  'POST account/settings': {
    rateLimits: false
  },
  'POST account/update_delivery_device': {
    rateLimits: {user: 0, app: 0}
  },
  'POST account/update_profile': {
    rateLimits: {user: 0, app: 0}
  },
  'POST account/update_profile_background_image': {
    rateLimits: {user: 0, app: 0}
  },
  'POST account/update_profile_colors': {
    rateLimits: {user: 0, app: 0}
  },
  'POST account/update_profile_image': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Blocks (ban, ignore)
  'GET blocks/list': {
    rateLimits: {user: 15, app: 0}
  },
  'GET blocks/ids': {
    rateLimits: {user: 15, app: 0}
  },
  'POST blocks/create': {
    rateLimits: {user: 0, app: 0}
  },
  'POST blocks/destroy': {
    rateLimits: {user: 0, app: 0}
  },

  // #### Profile banner
  'POST account/remove_profile_banner': {
    rateLimits: false
  },
  'POST account/update_profile_banner': {
    rateLimits: false
  },

  // ### Users
  'GET users/lookup': {
    rateLimits: {user: 180, app: 60}
  },
  'GET users/show': {
    rateLimits: {user: 180, app: 180}
  },
  'GET users/search': {
    rateLimits: {user: 180, app: 0}
  },
  'GET users/contributees': {
    rateLimits: {user: 15, app: 0}
  },
  'GET users/contributors': {
    rateLimits: {user: 15, app: 0}
  },

  // #### Profile banner
  'GET users/profile_banner': {
    rateLimits: {user: 180, app: 0}
  },

  // #### Suggestions
  'GET users/suggestions/': {
    rateLimits: {user: 15, app: 15}
  },
  'GET users/suggestions': {
    rateLimits: {user: 15, app: 15}
  },
  'GET users/suggestions//members': {
    rateLimits: {user: 15, app: 15}
  },

  // ### Favorites
  'GET favorites/list': {
    rateLimits: {user: 15, app: 15}
  },
  'POST favorites/destroy': {
    rateLimits: {user: 0, app: 0}
  },
  'POST favorites/create': {
    rateLimits: false
  },
  'GET favorites/': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Lists
  'GET lists/list': {
    rateLimits: {user: 15, app: 15}
  },
  'GET lists/statuses': {
    rateLimits: {user: 180, app: 180}
  },
  'POST lists/members/destroy': {
    rateLimits: {user: 0, app: 0}
  },
  'GET lists/memberships': {
    rateLimits: {user: 15, app: 15}
  },
  'GET lists/subscribers': {
    rateLimits: {user: 180, app: 15}
  },
  'POST lists/subscribers/create': {
    rateLimits: {user: 0, app: 0}
  },
  'GET lists/subscribers/show': {
    rateLimits: {user: 15, app: 15}
  },
  'POST lists/subscribers/destroy': {
    rateLimits: {user: 0, app: 0}
  },
  'POST lists/members/create_all': {
    rateLimits: {user: 0, app: 0}
  },
  'GET lists/members/show': {
    rateLimits: {user: 15, app: 15}
  },
  'GET lists/members': {
    rateLimits: {user: 180, app: 15}
  },
  'POST lists/members/create': {
    rateLimits: {user: 0, app: 0}
  },
  'POST lists/destroy': {
    rateLimits: {user: 0, app: 0}
  },
  'POST lists/update': {
    rateLimits: {user: 0, app: 0}
  },
  'POST lists/create': {
    rateLimits: {user: 0, app: 0}
  },
  'GET lists/show': {
    rateLimits: {user: 15, app: 15}
  },
  'GET lists/subscribtions': {
    rateLimits: {user: 15, app: 15}
  },
  'GET lists/members/destroy_all': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Saved searches
  'GET saved_searches/list': {
    rateLimits: {user: 15, app: 0}
  },
  'GET saved_searches/show/': {
    rateLimits: {user: 15, app: 0}
  },
  'POST saved_searches/create': {
    rateLimits: false
  },
  'POST saved_searches/destroy/': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Geo-data
  'GET geo/id/': {
    rateLimits: {user: 15, app: 0}
  },
  'GET geo/reverse_geocode': {
    rateLimits: {user: 15, app: 0}
  },
  'GET geo/search': {
    rateLimits: {user: 15, app: 0}
  },
  'GET geo/similar_places': {
    rateLimits: {user: 15, app: 0}
  },
  'POST geo/place': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Trends
  'GET trends/place': {
    rateLimits: {user: 15, app: 15}
  },
  'GET trends/available': {
    rateLimits: {user: 15, app: 15}
  },
  'GET trends/closest': {
    rateLimits: {user: 15, app: 15}
  },

  // ### Report spam
  // Also adds a block
  'POST users/report_spam': {
    rateLimits: {user: 0, app: 0}
  },

  // ### Authentication
  'GET oauth/authenticate': {
    rateLimits: false
  },
  'GET oauth/authorize': {
    rateLimits: false
  },
  'POST oauth/access_token': {
    rateLimits: false
  },
  'POST oauth/request_token': {
    rateLimits: false
  },
  'POST oauth2/token': {
    rateLimits: false
  },
  'POST oauth2/invalidate_token': {
    rateLimits: false
  },

  // ### Resources
  'GET help/configuration': {
    rateLimits: {user: 15, app: 15}
  },
  'GET help/languages': {
    rateLimits: {user: 15, app: 15}
  },
  'GET help/privacy': {
    rateLimits: {user: 15, app: 15}
  },
  'GET help/tos': {
    rateLimits: {user: 15, app: 15}
  },

  // ### Rate limiting
  'GET application/rate_limit_status': {
    rateLimits: {user: 180, app: 180}
  }
};
