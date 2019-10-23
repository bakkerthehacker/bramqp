'use strict';
const { once } = require('events');
class BaseClass {
	constructor(className, transmitter) {
		this.name = className;
		this.transmitter = transmitter;
	}
	method(methodName) {
		let method = this.transmitter.handle.spec.classes[this.name][methodName];
		return async(...args) => {
			let data = {};
			for (let field of method.field || []) {
				if (!field.reserved) {
					data[field.name] = args.shift();
				}
			}
			if (method.content) {
				let [properties, content] = args;
				await this.transmitter.methodWithContent(this.name, method.name, data, properties, content);
			} else {
				await this.transmitter.method(this.name, method.name, data);
			}
			if (method.response) {
				let responses = {};
				for (let response of method.response || []) {
					responses[response.name] = once(this.transmitter.handle.receive[this.name], response.name);
				}
				let [response] = await Promise.race(Object.values(responses));
				return response;
			}
		};
	}
}
const Class = new Proxy(BaseClass, {
	construct(Target, args) {
		return new Proxy(new Target(...args), {
			get(target, property) {
				let isChassisMethod;
				let method = target.transmitter.handle.spec.classes[target.name][property];
				if (method) {
					for (let chassis of method.chassis || []) {
						if (chassis.name !== target.transmitter.handle.chassis) {
							isChassisMethod = true;
						}
					}
					if (isChassisMethod) {
						return target.method(property);
					}
				}
				return Reflect.get(...arguments);
			}
		});
	}
});
class BaseTransmitter {
	constructor(handle) {
		this.handle = handle;
	}
	class(className) {
		return new Class(className, this);
	}
	async method(className, methodName, data) {
		const frameBuffer = this.methodBuffer(className, methodName, data);
		await this.handle.write(frameBuffer, 'utf8');
	}
	async methodWithContent(className, methodName, data, properties, content) {
		const frameBuffer = this.methodBuffer(className, methodName, data);
		const frameBuffers = this.contentBuffer(className, properties, content);
		frameBuffers.unshift(frameBuffer);
		await this.handle.write(Buffer.concat(frameBuffers), 'utf8');
	}
	async content(className, properties, content) {
		const frameBuffers = this.contentBuffer(className, properties, content);
		for (let frameBuffer of frameBuffers) {
			await this.handle.write(frameBuffer, 'utf8');
		}
	}
	async heartbeat() {
		const frameBuffer = this.heartbeatBuffer();
		await this.handle.write(frameBuffer, 'utf8');
	}
	methodBuffer(className, methodName, data) {
		let frameBuffer = Buffer.alloc(this.handle.frameSerializer.frameMax);
		frameBuffer.used = 0;
		frameBuffer = this.handle.frameSerializer.serializeFrameMethod(frameBuffer, this.handle.channelNumber, className, methodName, data);
		return frameBuffer.slice(0, frameBuffer.used);
	}
	contentBuffer(className, properties, content) {
		let contentBuffer;
		if (typeof content === 'string') {
			contentBuffer = Buffer.from(content);
		} else if (content instanceof Buffer) {
			contentBuffer = content;
		}
		let frameBuffers = [];
		let frameHeaderBuffer = Buffer.alloc(this.handle.frameSerializer.frameMax);
		frameHeaderBuffer.used = 0;
		this.handle.frameSerializer.serializeFrameContentHeader(frameHeaderBuffer, this.handle.channelNumber, className, contentBuffer.length, properties);
		frameBuffers.push(frameHeaderBuffer.slice(0, frameHeaderBuffer.used));
		let contentChunkStart = 0;
		let contentChunkEnd = 0;
		while (contentChunkEnd !== contentBuffer.length) {
			contentChunkStart = contentChunkEnd;
			contentChunkEnd = Math.min(contentBuffer.length, contentChunkStart + this.handle.frameSerializer.frameMax - 8);
			let frameBuffer = Buffer.alloc(this.handle.frameSerializer.frameMax);
			frameBuffer.used = 0;
			let contentChunk = contentBuffer.slice(contentChunkStart, contentChunkEnd);
			contentChunk.used = contentChunk.length;
			frameBuffer = this.handle.frameSerializer.serializeFrameContentBody(frameBuffer, this.handle.channelNumber, contentChunk);
			frameBuffers.push(frameBuffer.slice(0, frameBuffer.used));
		}
		return frameBuffers;
	}
	heartbeatBuffer() {
		let frameBuffer = Buffer.alloc(this.handle.frameSerializer.frameMax);
		frameBuffer.used = 0;
		frameBuffer = this.handle.frameSerializer.serializeFrameHeartbeat(frameBuffer);
		return frameBuffer.slice(0, frameBuffer.used);
	}
}
const Transmitter = new Proxy(BaseTransmitter, {
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
module.exports = Transmitter;
