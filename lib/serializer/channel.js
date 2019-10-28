/*jshint ignore:start */
const { BaseSerializer } = require('./base');
class ChannelSerializer extends BaseSerializer {
	key = 'channel';
}
Object.assign(module.exports, { ChannelSerializer });
