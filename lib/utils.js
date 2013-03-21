/*jshint node: true, curly: true, eqeqeq: true, immed: true, indent: 2,
latedef: true, noarg: true, noempty: true, nonew: true, plusplus: true,
quotmark: single, undef: true, unused: true, trailing: true, maxlen: 80*/

/*
 * Merge objects into the first one
 */

exports.merge = function(defaults) {
  for (var i = 1; i < arguments.length; i+=1) {
    for (var opt in arguments[i]) {
      defaults[opt] = arguments[i][opt];
    }
  }
  return defaults;
};
