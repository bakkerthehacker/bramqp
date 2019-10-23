'use strict';
const assert = require('assert');
module.exports.checkAssertion = function(data, assertion) {
	const assertLookup = {
		length(data, assertion) {
			return data.length <= parseInt(assertion.value, 10);
		},
		regexp(data, assertion) {
			let reg = new RegExp(assertion.value);
			return reg.test(data);
		},
		notnull(data, assertion) {
			return !!data;
		},
		null(data, assertion) {
			return !data;
		},
		ne(data, assertion) {
			return data !== parseInt(assertion.value, 10);
		},
		syntax(data, assertion) {
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
