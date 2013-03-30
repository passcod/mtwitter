'use strict';

var _             = require('underscore');
var errors        = require('./errors');
var request       = require('request');
var utils         = require('./utils');

module.exports = function(options) {
  var state = {
    requestPool: [],
    rateLimits: {}
  };

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

  var updateRateLimits = function(resource, rateLimit) {
    //console.info(JSON.stringify(rateLimit));
    if (Object.keys(module.exports.resources).indexOf(resource) !== -1) {
      state.rateLimits[resource] = rateLimit;
    }
  };

  var queueRequest = function(method, url, params, callback) {
    var post = /post/i.test(method);

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

    if (url.charAt(0) !== '/') {
      url = '/' + url;

      if (/http/i.test(url)) {
        throw new errors.ArgumentError('url', 'must be a relative URL');
      }
    }

    state.requestPool.push({
      post: post,
      url: options.rest_base + url,
      resource: resourceFromUrl(url, post),
      params: params,
      callback: callback
    });
  };

  var processRequest = function(req) {
    var handleResponse = function(error, response) {
      if (!error) {
        try {
          var json = JSON.parse(response.body);
          if (json.errors) {
            throw new errors.TwitterError(json.errors);
          }

          var rateLimit = {
            reset: response.headers['x-rate-limit-reset'],
            remaining: response.headers['x-rate-limit-remaining'],
            limit: response.headers['x-rate-limit-limit']
          };

          updateRateLimits(req.resource, rateLimit);
          req.callback(null, json, rateLimit);
          state.requestPool = _.without(state.requestPool, req);
          return;
        } catch (err) {
          error = err;
        }
      } else if (error.statusCode) {
        error.response = response;
        error = new errors.HTTPError(error);
      }
      req.callback(error);
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

  var drainPool = function(limit) {
    if (!limit) {
      limit = 180;
    }

    _.chain(state.requestPool).first(limit).each(processRequest);
  };

  this.drainPool = drainPool;
  this.queueRequest = queueRequest;
};

module.exports.resources = {
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

  'GET search/tweets': {
    rateLimits: {user: 180, app: 450}
  },

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

  'POST account/remove_profile_banner': {
    rateLimits: false
  },
  'POST account/update_profile_banner': {
    rateLimits: false
  },
  'GET users/profile_banner': {
    rateLimits: {user: 180, app: 0}
  },

  'GET users/suggestions/': {
    rateLimits: {user: 15, app: 15}
  },
  'GET users/suggestions': {
    rateLimits: {user: 15, app: 15}
  },
  'GET users/suggestions//members': {
    rateLimits: {user: 15, app: 15}
  },

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

  'GET trends/place': {
    rateLimits: {user: 15, app: 15}
  },
  'GET trends/available': {
    rateLimits: {user: 15, app: 15}
  },
  'GET trends/closest': {
    rateLimits: {user: 15, app: 15}
  },

  'POST users/report_spam': {
    rateLimits: {user: 0, app: 0}
  },

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

  'GET application/rate_limit_status': {
    rateLimits: {user: 180, app: 180}
  }
};
