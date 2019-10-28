/*jshint ignore:start */
const { BaseSerializer } = require('./base');
class ClassSerializer extends BaseSerializer {
	key = 'className';
}
Object.assign(module.exports, { ClassSerializer });
