'use strict';

exports.merge = function(defaults) {
  for (var i = 1; i < arguments.length; i+=1) {
    for (var opt in arguments[i]) {
      defaults[opt] = arguments[i][opt];
    }
  }
  return defaults;
};

exports.sanitizeOAuthContent = function(content) {
  // Workaround: oauth + booleans == broken signatures
  if (content && typeof content === 'object') {
    Object.keys(content).forEach(function(e) {
      if ( typeof content[e] === 'boolean' ) {
        content[e] = content[e].toString();
      }
    });
  }

  return content;
};
