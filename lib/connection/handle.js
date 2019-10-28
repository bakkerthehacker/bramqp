'use strict';
const util = require('util');
const { EventEmitter, once } = require('events');
const { Duplex, Readable } = require('stream');
const { FrameParser } = require('../parser/frame');
const { FrameSerializer } = require('../serializer/frame');
const { ChannelParser } = require('../parser/channel');
const { ChannelSerializer } = require('../serializer/channel');
const { ClassParser } = require('../parser/class');
const { ClassSerializer } = require('../serializer/class');
const { MethodParser } = require('../parser/method');
const { MethodSerializer } = require('../serializer/method');
class AbstractHandle extends Duplex {
	constructor() {
		super({
			objectMode: true
		});
	}
	_read(...args) {
		// TODO backpressure pause/resume??
		// There are 5-ish ways to do this
		this.parser.on('data', (data) => this.push(data));
		this.parser.once('end', () => this.push(null));
	}
	_write(...args) {
			this.serializer.write(...args);
		}
		// Unsure if the async iterators should be cached
		// [Symbol.asyncIterator]() {
		// 	let asyncIterator = super[Symbol.asyncIterator]()
		// 	this[Symbol.asyncIterator] = () => asyncIterator;
		// 	return asyncIterator;
		// }
}
class Method extends AbstractHandle {
	constructor(theClass, methodName) {
		super();
		this.class = theClass;
		this.methodName = methodName;
		this.parser = new MethodParser(this.methodName);
		this.serializer = new MethodSerializer(this.methodName);
		this.class.parser.pipe(this.parser, { end: false });
		this.serializer.pipe(this.class.serializer, { end: false });
		this.methodSpec = this.class.channel.handle.spec.classes[this.class.className][this.methodName];
		const CallableMethod = async(...args) => {
			let data = {};
			for (let field of this.methodSpec.field || []) {
				if (!field.reserved) {
					data[field.name] = args.shift();
				}
			}
			let methodFrameData = {
				data,
				method: this.methodSpec
			};
			if (this.methodSpec.content) {
				let [properties, content] = args;
				Object.assign(methodFrameData, { properties, content });
			}
			let write = util.promisify(this.write).bind(this);
			await write(methodFrameData);
			if (this.methodSpec.response) {
				let responses = {};
				for (let response of this.methodSpec.response || []) {
					responses[response.name] = once(this.class[response.name], 'data');
				}
				let [response] = await Promise.race(Object.values(responses));
				return response;
			}
		};
		Object.assign(CallableMethod, this);
		Object.setPrototypeOf(CallableMethod, Object.getPrototypeOf(this));
		return CallableMethod;
	}
}
class Class extends AbstractHandle {
	constructor(channel, className) {
		super();
		this.channel = channel;
		this.className = className;
		this.parser = new ClassParser(this.className);
		this.serializer = new ClassSerializer(this.className);
		this.channel.parser.pipe(this.parser, { end: false });
		this.serializer.pipe(this.channel.serializer, { end: false });
		let proxy = new Proxy(this, {
			get(target, methodName) {
				if (!target[methodName]) {
					if (target.channel.handle.spec.classes[target.className][methodName]) {
						target[methodName] = new Method(proxy, methodName);
					}
				}
				return Reflect.get(...arguments);
			}
		});
		return proxy;
	}
}
class Channel extends AbstractHandle {
	constructor(handle, channelNumber) {
		super();
		this.handle = handle;
		this.channelNumber = channelNumber;
		this.parser = new ChannelParser(this.channelNumber);
		this.serializer = new ChannelSerializer(this.channelNumber);
		this.handle.parser.pipe(this.parser, { end: false });
		this.serializer.pipe(this.handle.serializer, { end: false });
		let proxy = new Proxy(this, {
			get(target, className) {
				if (!target[className]) {
					if (target.handle.spec.classes[className]) {
						target[className] = new Class(proxy, className);
					}
				}
				return Reflect.get(...arguments);
			}
		});
		return proxy;
	}
	async openAMQPChannel() {
		await this.channel.open();
		this.channel.close.on('data', async({ respond }) => {
			// TODO
			await respond['close-ok']();
			await this.channel.open();
		});
		this.channel.flow.on('data', async({ respond, data }) => {
			// TODO
			await respond['flow-ok'](data.active);
			if (data.active) {
				this.frameSerializer.resume();
			} else {
				this.frameSerializer.pause();
			}
		});
	}
	async closeAMQPChannel() {
		await this.channel.close(200, 'Closing channel');
	}
}
class Handle extends AbstractHandle {
	constructor(socket, spec, chassis) {
		super();
		this.socket = socket;
		this.spec = spec;
		this.chassis = chassis;
		this.client = (this.chassis === 'client');
		this.server = (this.chassis === 'server');
		this.parser = new FrameParser(this.spec);
		this.serializer = new FrameSerializer(this.spec);
		this.socket.pipe(this.parser, { end: false });
		this.serializer.pipe(this.socket, { end: false });
	}
	async init() {
		Readable.from(['AMQP', String.fromCharCode(0, this.spec.amqp.major, this.spec.amqp.minor, this.spec.amqp.revision)], { objectMode: false }).pipe(this.socket, { end: false });
	}
	channel(number) {
		if (!this.channel[number]) {
			this.channel[number] = new Channel(this, number);
		}
		return this.channel[number];
	}
	clientProperties(serverPropertiesData) {
		const clientCapabilities = {};
		const serverCapabilities = serverPropertiesData['server-properties']['capabilities'];
		for (let capability in serverCapabilities) {
			if (serverCapabilities[capability]) {
				clientCapabilities[capability] = {
					type: 'Boolean',
					data: true
				};
			}
		}
		const clientProperties = {
			product: {
				type: 'Long string',
				data: 'bramqp'
			},
			version: {
				type: 'Long string',
				data: require('../bramqp').version
			},
			platform: {
				type: 'Long string',
				data: 'Node.js'
			},
			capabilities: {
				type: 'Nested Table',
				data: clientCapabilities
			},
			information: {
				type: 'Long string',
				data: 'See https://github.com/bakkerthehacker/bramqp'
			},
		};
		return clientProperties;
	}
	async openAMQPCommunication(username = 'guest', password = 'guest', heartbeat = true, vhost = '/') {
		let [{ data, method }] = await once(this.channel(0).connection.start, 'data');
		let respond = this.channel(0).connection[method.response[0].name];
		await respond(this.clientProperties(data), 'AMQPLAIN', {
			LOGIN: {
				type: 'Long string',
				data: username
			},
			PASSWORD: {
				type: 'Long string',
				data: password
			}
		}, 'en_US');
		[{ data, method }] = await once(this.channel(0).connection.tune, 'data');
		respond = this.channel(0).connection[method.response[0].name];
		let channelMax = data['channel-max'];
		if (channelMax === 0) {
			channelMax = (1 << 16) - 1;
		}
		this.serializer.frameMax = data['frame-max'];
		if (heartbeat) {
			if (heartbeat === true) {
				heartbeat = data.heartbeat;
			}
		} else {
			heartbeat = 0;
		}
		await respond(channelMax, data['frame-max'], heartbeat);
		if (heartbeat && data.heartbeat) {
			this.heartbeatsMissed = 0;
			this.heartbeatIntervalId = setInterval(() => {
				Readable.from([{ frame: 'heartbeat' }]).pipe(this);
				if (this.heartbeatsMissed >= 2) {
					throw new Error('oh no! server is not sending heartbeats!');
				}
				this.heartbeatsMissed++;
			}, heartbeat * 1000);
			this.on('data', () => {
				this.heartbeatsMissed = 0;
			});
			this.socket.once('close', () => {
				clearInterval(this.heartbeatIntervalId);
			});
		}
		await this.channel(0).connection.open(vhost);
	}
	async closeAMQPCommunication() {
		await this.channel(0).connection.close(200, 'Closing connection');
		clearInterval(this.heartbeatIntervalId);
	}
}
Object.assign(module.exports, { Handle });
