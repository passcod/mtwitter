'use strict';

var _             = require('underscore');
var errors        = require('./errors');
var request       = require('request');
var utils         = require('./utils');

module.exports = function TwitterRest(options) {
  // ## State
  // Rather than storing state directly on the
  // `this` object, or in a multitude of variables,
  // there are only two: `options`, which hold the
  // global options and is passed to us, and `state`
  // which is outlined below.
  var state = {

    // ### Request pools
    // Instead of firing off requests immediately, they
    // are stored in `pools` and executed later on, not
    // always sequentially. For example, requests that
    // have hit the rate limit will be kept in and run
    // within the next available window.
    pools: {
      todo: [],
      doing: []
    },

    // ### Rate limiting
    // Rate limits are kept up-to-date dynamically here.
    rateLimits: {},

    // ### Twitter configuration
    // Contains the information found at `/help/configuration`.
    // This is requested at startup and every 24 hours
    // after this.
    config: {},

    // ### Scheduling
    // Contains information and configuration about
    // scheduling: the process of managing and firing
    // off requests depending on timings and rate limiting.
    //
    // All values can be modified _at runtime._
    scheduling: {
      // #### Main drain
      // Perform a main drain every minute, limited
      // to 50 requests. This should be more than enough,
      // and will pace the throughput a bit if hit.
      main: {
        interval: 60 * 1000,
        limit: 50
      },

      // #### Reduced main drain
      // This is used when an unexpected 429 is hit.
      // If a 429 is hit again while using this, the
      // main drain schedule is stopped for a full window.
      reduced: {
        interval: 60 * 1000,
        limit: 5
      },

      // #### Rate limit information
      // Refresh the global rate limit information
      // once every 15 minutes. These are also refreshed
      // on a per-request basis.
      limits: {
        interval: 15 * 60 * 1000
      },

      // #### Twitter configuration
      // Twitter recommends its configuration to be fetched at
      // application start and every 24 hours after that.
      config: {
        interval: 24 * 60 * 60 * 1000
      }
    }
  };


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

  // Update the rate limit information given a resource
  // string and a response (HTTP). At the moment, only
  // GET requests are explicitely rate limited, so we
  // ignore the rest. Additionally, only resources we
  // know about are considered. The `reset` field is
  // converted to a `Date` object for ease of use.
  var updateRateLimits = function(resource, response) {
    var isListed = _.has(module.exports.resources, resource);
    if (isListed && response.req.method === 'GET') {
      var limits = {};
      ['reset', 'remaining', 'limit'].forEach(function(h) {
        if (_.has(response.headers, 'x-rate-limit-' + h)) {
          limits[h] = +response.headers['x-rate-limit-' + h];
        }
      });
      if (limits.reset) {
        limits.reset = new Date(limits.reset * 1000);
      }
      state.rateLimits[resource] = limits;
    }
  };

  // Valid URLs that are passed in match the regex
  // `^/?[a-zA-Z0-9/_]+(\.json)?$`. We want to have
  // them all in full absolute format, ready to be
  // used in a request.
  var canonizeUrl = function(url) {
    if (url.charAt(0) !== '/') {
      url = '/' + url;

      // Don't pass in absolute URLs, thanks.
      if (/http/i.test(url)) {
        throw new errors.ArgumentError('url', 'must be a relative URL');
      }
    }

    if (!/\.json$/i.test(url)) {
      url += '.json';
    }

    return options.rest_base + url;
  };


  // ## Queue a request
  // This is mostly a matter of filtering the input
  // to make sure everything is as expected, and to
  // arrange what input we do let through exactly as
  // we want it.
  var queueRequest = function(method, url, params, callback) {
    var post = /post/i.test(method);

    // The `params` argument is optional, everything
    // else is required. The code below is pretty much
    // self-explanatory.
    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    if (post) {
      if (!params) {
        throw new errors.ArgumentRequiredError('params', 'for POST');
      }

      if (!params.content) {
        throw new errors.ArgumentRequiredError('params.content', 'for POST');
      }

      if (!params.contentType) {
        params.contentType = 'application/x-www-form-urlencoded';
      }
    }

    if (typeof callback !== 'function') {
      throw new errors.NoCallbackError();
    }

    state.pools.todo.push({
      post: post,
      url: canonizeUrl(url),
      resource: resourceFromUrl(url, post),
      params: params,
      callback: callback
    });
  };

  // ## Requeue a request
  // If we've hit the rate limit, requeue the
  // request and schedule a targeted drain.
  var requeueRequest = function(req) {
    console.log('Hit rate limit, requeuing.');
    state.pools.todo.push(req);
  };

  // ## Process a request
  // This is done in three parts: first, the request
  // options are prepared, including any special
  // requirements for authentication and POST;
  // second, the request is checked for rate limiting;
  // and finally, the request is sent and its response
  // is parsed and triaged.
  var processRequest = function(req) {
    // Move the request from one pool to
    // the other, so it is not run twice.
    var i = state.pools.todo.indexOf(req);
    state.pools.doing.push(req);
    delete state.pools.todo[i];

    var handleResponse = function(error, response) {
      // Update the rate limits (see above), and
      // delete the request from the pools, now that
      // it has run.
      updateRateLimits(req.resource, response);
      var i = state.pools.doing.indexOf(req);
      delete state.pools.doing[i];

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
      reqOptions.body = req.params.content;
    } else {
      method = request.get;
      reqOptions.qs = req.params;
    }

    reqOptions.headers = utils.merge(options.headers, headers);
    method(reqOptions, handleResponse);
  };


  // ## Scheduling

  // ### Twitter configuration
  // Get the config from /help/configuration. This should
  // be run at startup and every 24 hours after that.
  var getConfig = function() {
    var setConfig = function(error, data) {
      if (!error) {
        state.config = data;
      }
    };
    queueRequest('GET', '/help/configuration', setConfig);
    setTimeout(getConfig, state.scheduling.config.interval);
  };

  // ### Rate limits
  // Get the latest global rate-limit information. See `state`
  // object near the top for scheduling details.
  var getLimits = function() {
    var setLimits = function(error, data) {
      if (!error) {
        // The twitter response is divided accross "families" of
        // requests. We don't really care for all that.
        data.resources.forEach(function eachFamily(family) {
          family.forEach(function eachResource(resource, limits) {
            resource = resourceFromUrl(resource);
            state.rateLimits[resource] = limits;
          });
        });
      }
    };
    queueRequest('GET', '/application/rate_limit_status', setLimits);
    setTimeout(getLimits, state.scheduling.limits.interval);
  };

  // ### Main drain
  var mainDrain = function() {
    _(state.pools.todo).chain()
      .first(50)
      .each(processRequest);

    setTimeout(mainDrain, state.scheduling.main.interval);
  };

  // _Expose properties and start tasks_
  this.queueRequest = queueRequest;
  this.drain = mainDrain;
  this.state = state;

  getConfig();
  getLimits();
  mainDrain();
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
