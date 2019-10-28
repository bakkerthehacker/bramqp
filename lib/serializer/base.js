const { Transform } = require('stream');
class BaseSerializer extends Transform {
	constructor(name) {
		super({
			objectMode: true
		});
		this.name = name;
	}
	_transform(data, encoding, callback) {
		data[this.key] = this.name;
		this.push(data);
		callback();
	}
}
Object.assign(module.exports, { BaseSerializer });
