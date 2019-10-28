/*jshint ignore:start */
const { BaseFilterParser } = require('./base');
class ClassParser extends BaseFilterParser {
	key = 'className'; /*jshint ignore:line */
}
Object.assign(module.exports, { ClassParser });
