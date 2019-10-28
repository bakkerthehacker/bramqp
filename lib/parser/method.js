/*jshint ignore:start */
const { BaseFilterParser } = require('./base');
class MethodParser extends BaseFilterParser {
	key = 'methodName'; /* jshint ignore:line */
}
Object.assign(module.exports, { MethodParser });
