
/*
 * Merge two objects into the first one
 */ 

exports.merge = function(defaults, options) {
	for(var opt in options){
		defaults[opt] = options[opt];
	}
	return defaults;
};
