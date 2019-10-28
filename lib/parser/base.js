const { Transform } = require('stream');
class BaseFilterParser extends Transform {
	constructor(name) {
		super({
			objectMode: true
		});
		this.name = name;
	}
	_transform(data, encoding, callback) {
		if (data[this.key] === this.name) {
			this.push(data);
		}
		callback();
	}
}
Object.assign(module.exports, { BaseFilterParser });
