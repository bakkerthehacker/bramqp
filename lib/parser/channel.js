/*jshint ignore:start */
const { BaseFilterParser } = require('./base');
class ChannelParser extends BaseFilterParser {
	key = 'channel'; /*jshint ignore:line */
}
Object.assign(module.exports, { ChannelParser });
