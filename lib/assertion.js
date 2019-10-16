'use strict';
const assert = require('assert');
module.exports.checkAssertion = function(data, assertion) {
	const assertLookup = {
		'length': function(data, assertion) {
			return data.length <= parseInt(assertion.value, 10);
		},
		'regexp': function(data, assertion) {
			let reg = new RegExp(assertion.value);
			return reg.test(data);
		},
		'notnull': function(data, assertion) {
			return !!data;
		},
		'null': function(data, assertion) {
			return !data;
		},
		'ne': function(data, assertion) {
			return data !== parseInt(assertion.value, 10);
		},
		'syntax': function(data, assertion) {
			if (assertion.rule === 'path') {
				let reg = new RegExp('^(|/[^/]*)$');
				return reg.test(data);
			}
			return false;
		},
		// le, enum
	};
	if (assertLookup[assertion.check]) {
		assert(assertLookup[assertion.check](data, assertion));
	}
};
