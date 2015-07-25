'use strict';

var assert = require('assert');

module.exports.checkAssertion = function(assertion, data) {
	var assertLookup = {
		'length' : function(assertion, data) {
			assert(data.length <= parseInt(assertion.value, 10));
		},
		'regexp' : function(assertion, data) {
			var reg = new RegExp(assertion.value);
			assert(reg.test(data));
		},
		'notnull' : function(assertion, data) {
			assert(data);
		},
		// le
	};

	if(assertLookup[assertion.check]){
		assertLookup[assertion.check](assertion, data);
	}
};
