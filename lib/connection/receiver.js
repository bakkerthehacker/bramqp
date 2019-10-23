'use strict';
const { EventEmitter, once } = require('events');
class Class extends EventEmitter {
	constructor(className, receiver) {
		super();
		this.name = className;
		this.receiver = receiver;
		this.receiver.on('method', (data) => {
			if (data.className === this.name) {
				this.emit(data.method.name, data);
			}
		});
	}
}
class BaseReceiver extends EventEmitter {
	constructor(handle) {
		super();
		this.handle = handle;
		this.handle.frameParser.on(this.handle.channelNumber + ':heartbeat', this.heartbeat.bind(this));
		this.handle.frameParser.on(this.handle.channelNumber + ':method', this.method.bind(this));
	}
	heartbeat() {
		this.emit('heartbeat');
	}
	async method({ channel, className, method, fieldData }) {
		let header;
		let body;
		let respond;
		if (method.content) {
			header = once(this.handle.frameParser, this.handle.channelNumber + ':header');
			body = once(this.handle.frameParser, this.handle.channelNumber + ':body');
			[{ properties: header }] = await header;
			[{ buffer: body }] = await body;
		}
		if (method.response) {
			respond = {};
			for (let response of method.response || []) {
				respond[response.name] = this.handle.send[className][response.name];
			}
		}
		this.emit('method', { channel, className, method, fieldData, header, body, respond });
	}
	class(className) {
		return new Class(className, this);
	}
}
const Receiver = new Proxy(BaseReceiver, {
	construct(Target, args) {
		return new Proxy(new Target(...args), {
			get(target, property) {
				if (target.handle.spec.classes[property]) {
					return target.class(property);
				}
				return Reflect.get(...arguments);
			}
		});
	}
});
module.exports = Receiver;
