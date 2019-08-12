'use strict';
const util = require('util');
const { once } = require('events');
const FrameParser = require('./frameParser');
const FrameSerializer = require('./frameSerializer');
const specification = require('./specification');
class Client {
	constructor(handle) {
		this.handle = handle;
		if (typeof this.handle.channel === 'number') {
			this.channel = this.handle.channel;
		} else {
			this.channel = 0;
		}
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
		frameBuffer = this.handle.frameSerializer.serializeFrameMethod(frameBuffer, this.channel, className, methodName, data);
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
		this.handle.frameSerializer.serializeFrameContentHeader(frameHeaderBuffer, this.channel, className, contentBuffer.length, properties);
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
			frameBuffer = this.handle.frameSerializer.serializeFrameContentBody(frameBuffer, this.channel, contentChunk);
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
const clientMethodHandler = {
	get({ client, className }, methodName, receiver) {
		let isClientMethod;
		let method = client.handle.specData.classes[className][methodName];
		if (method) {
			for (let chassis of method.chassis || []) {
				if (chassis.name === 'server') {
					isClientMethod = true;
				}
			}
			if (isClientMethod) {
				return async(...args) => {
					let data = {};
					for (let field of method.field || []) {
						if (!field.reserved) {
							data[field.name] = args.shift();
						}
					}
					console.log(`client method ${client.channel}:${className}.${method.name}`);
					console.log(data);
					if (method.content) {
						let [properties, content] = args;
						await client.methodWithContent(className, method.name, data, properties, content);
					} else {
						await client.method(className, method.name, data);
					}
					if (method.response) {
						let responses = {};
						for (let response of method.response || []) {
							responses[response.name] = client.handle.server[className][response.name]().next();
						}
						let response = await Promise.race(Object.values(responses));
						return response.value;
					}
				};
			}
		}
		return Reflect.get(...arguments);
	}
};
const clientClassHandler = {
	get(client, className, receiver) {
		if (className in client.handle.specData.classes) {
			return new Proxy({ client, className }, clientMethodHandler);
		}
		return Reflect.get(...arguments);
	}
};
class Server {
	constructor(handle) {
		this.handle = handle;
		if (typeof this.handle.channel === 'number') {
			this.channel = this.handle.channel;
		}
	}
	async * heartbeat() {
		yield * this.handle.frameParser.heartbeat();
	}
	async * method(classFilter, methodFilter) {
		let content;
		if (this.handle.specData.classes[classFilter][methodFilter].content) {
			content = this.content(classFilter).next();
		}
		for await (let [channel, className, method, fieldData] of this.handle.frameParser.method()) {
			if (this.channel === undefined || this.channel === channel) {
				if (classFilter === undefined || classFilter === className) {
					if (methodFilter === undefined || methodFilter === method.name) {
						console.log(`server method ${channel}:${className}.${method.name}, (${method.content? 'content' : ''})`);
						console.log(fieldData);
						let respond = {};
						for (let response of method.response || []) {
							respond[response.name] = this.handle.client[className][response.name];
						}
						yield {
							className,
							method,
							fieldData,
							...(method.response && { respond }),
							...(method.content && (await content).value),
						};
					}
				}
			}
		}
	}
	async * content(classFilter) {
		for await (let [channel, className, size, properties] of this.handle.frameParser.header()) {
			if (this.channel === undefined || this.channel === channel) {
				if (classFilter === undefined || classFilter === className) {
					this.frameBodyClass = className;
					let used = 0;
					let buffers = [];
					for await (let { channel, buffer }
						of this.handle.frameParser.body()) {
						if (this.channel === undefined || this.channel === channel) {
							buffers.push(buffer);
							used += buffer.length;
							if (used === size) {
								let content = Buffer.concat(this.frameBodyBuffer.buffers);
								yield { properties, content };
							}
						}
					}
				}
			}
		}
	}
}
const serverMethodHandler = {
	get({ server, className }, methodName, receiver) {
		let isServerMethod;
		let method = server.handle.specData.classes[className][methodName];
		if (method) {
			if (method.chassis) {
				for (let chassis of method.chassis) {
					if (chassis.name === 'client') {
						isServerMethod = true;
					}
				}
			}
			if (isServerMethod) {
				return async function*() {
					yield * server.method(className, methodName);
				};
			}
		}
		return Reflect.get(...arguments);
	}
};
const serverClassHandler = {
	get(server, className, receiver) {
		if (className in server.handle.specData.classes) {
			return new Proxy({ server, className }, serverMethodHandler);
		}
		return Reflect.get(...arguments);
	}
};
class ConnectionHandle {
	async init(socket, specPath) {
		this.socket = socket;
		this.write = util.promisify(this.socket.write).bind(this.socket);
		this.specData = await specification.fetchSpecification(specPath);
		this.frameParser = new FrameParser(this.specData, this.socket);
		this.frameSerializer = new FrameSerializer(this.specData);
		this.frameBodyBuffer = {};
		this.frameBodyProperties = {};
		this.frameBodyClass = {};
		this.write('AMQP' + String.fromCharCode(0, this.specData.amqp.major, this.specData.amqp.minor, this.specData.amqp.revision));
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
				data: require('./bramqp').version
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
		let { fieldData, respond } = (await this.server.connection.start().next()).value;
		await respond['start-ok'](this.clientProperties(fieldData), 'AMQPLAIN', {
			LOGIN: {
				type: 'Long string',
				data: username
			},
			PASSWORD: {
				type: 'Long string',
				data: password
			}
		}, 'en_US');
		({ fieldData, respond } = (await this.server.connection.tune().next()).value);
		let channelMax = fieldData['channel-max'];
		if (channelMax === 0) {
			channelMax = (1 << 16) - 1;
		}
		this.frameSerializer.frameMax = fieldData['frame-max'];
		if (heartbeat) {
			if (heartbeat === true) {
				heartbeat = fieldData.heartbeat;
			}
		} else {
			heartbeat = 0;
		}
		await respond['tune-ok'](channelMax, fieldData['frame-max'], heartbeat);
		if (heartbeat && fieldData.heartbeat) {
			this.heartbeatsMissed = 0;
			this.heartbeatIntervalId = setInterval(async() => {
				await this.client.heartbeat();
				if (this.heartbeatsMissed >= 2) {
					throw new Error('oh no! server is not sending heartbeats!');
				}
				this.heartbeatsMissed++;
			}, heartbeat * 1000);
			this.socket.once('close', () => {
				clearInterval(this.heartbeatIntervalId);
			});
			let serverHeartbeats = async() => {
				for await (let serverHeartbeat of this.server.heartbeat()) {
					this.heartbeatsMissed = 0;
				}
			};
			serverHeartbeats();
		}
		await this.client.connection.open(vhost);
		await this.channel(1).client.channel.open();
		let reopenChannel = async() => {
			for await (let channelClose of this.channel(1).server.channel.close()) {
				await channelClose.respond();
				await (await this.channel(1).client.channel.open()).response();
			}
		};
		reopenChannel();
		let pauseResume = async() => {
			for await (let channelFlow of this.channel(1).server.channel.flow()) {
				await channelFlow.respond(channelFlow.active);
				if (channelFlow.active) {
					this.socket.resume();
				} else {
					this.socket.pause();
				}
			}
		};
	}
	async closeAMQPCommunication(callback) {
		await this.channel(1).client.channel.close(200, 'Closing channel');
		await this.client.connection.close(200, 'Closing connection');
		clearInterval(this.heartbeatIntervalId);
	}
	channel(channelNumber) {
		let channelHandler = {
			get(target, prop, receiver) {
				if (prop === 'channel') {
					return channelNumber;
				}
				return Reflect.get(...arguments);
			}
		};
		return new Proxy(this, channelHandler);
	}
	get client() {
		return new Proxy(new Client(this), clientClassHandler);
	}
	get server() {
		return new Proxy(new Server(this), serverClassHandler);
	}
}
module.exports = ConnectionHandle;
