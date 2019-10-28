/*jshint ignore:start */
const { BaseSerializer } = require('./base');
class MethodSerializer extends BaseSerializer {
	key = 'methodName';
	_transform(data, encoding, callback) {
		data['frame'] = 'method';
		super._transform(data, encoding, callback)
	}
}
Object.assign(module.exports, { MethodSerializer });
