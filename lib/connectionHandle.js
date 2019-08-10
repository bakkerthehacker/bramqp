'use strict';
var util = require('util');
var async = require('async');
var EventEmitter = require('events');
var FrameParser = require('./frameParser');
var FrameSerializer = require('./frameSerializer');
var specification = require('./specification');
class ConnectionHandle extends EventEmitter {
	constructor(socket, specPath) {
		super();
		this.socket = socket;
		specification.fetchSpecification(specPath, (error, specification) => {
			if (error) {
				return this.emit('error', error);
			}
			this.specData = specification;
			this.initializeMethodFunctions();
			this.frameParser = new FrameParser(this.specData);
			this.frameSerializer = new FrameSerializer(this.specData);
			this.frameMax = this.frameSerializer.frameMax;
			this.frameBodyBuffer = {};
			this.frameBodyProperties = {};
			this.frameBodyClass = {};
			this.frameParser.on('error', (error) => {
				this.emit('error', error);
			});
			this.frameSerializer.on('error', (error) => {
				this.emit('error', error);
			});
			this.initializeFrameParserListeners();
			this.socket.once('data', (data) => {
				this.socket.on('data', (data) => {
					this.frameParser.parse(data);
				});
				if (data.slice(0, 4) === 'AMQP') {
					var errorMessage = 'Server does not support AMQP version ' + this.specData.amqp.major + '-' + this.specData.amqp.minor + '-' + this.specData.amqp.revision + '. ' + 'The server suggests version ' + data[5] + '-' + data[6] + '-' + data[7] + '. ';
					var error = new Error(errorMessage);
					this.emit('error', error);
				} else {
					this.frameParser.parse(data);
				}
			});
			this.socket.on('error', (error) => {
				if (error.code === 'ECONNRESET') {
					this.emit('ECONNRESET', error);
				} else {
					this.emit('error', error);
				}
			});
			this.socket.write('AMQP' + String.fromCharCode(0, this.specData.amqp.major, this.specData.amqp.minor, this.specData.amqp.revision), () => {
				this.emit('init');
			});
		});
	}
	initializeMethodFunctions() {
		this.specData.amqp['class'].forEach((theClass) => {
			this[theClass.name] = {};
			theClass.method.forEach((method) => {
				this[theClass.name][method.name] = function() {
					var args = Array.prototype.slice.call(arguments);
					var callback;
					var channel = 0;
					var properties;
					var content;
					if (args.length && typeof args[args.length - 1] === 'function') {
						callback = args.pop();
					}
					if (args.length && theClass.handler === 'channel') {
						channel = args.shift();
					}
					var data = {};
					if (method.field) {
						var reservedFields = 0;
						for (var i in method.field) {
							if (method.field[i].reserved) {
								reservedFields++;
							} else {
								data[method.field[i].name] = args.shift();
							}
						}
					}
					if (args.length >= 2) {
						properties = args.shift();
						content = args.shift();
					}
					if (content && method.content === '1') {
						this.methodWithContent(channel, theClass.name, method.name, data, properties, content, callback);
					} else {
						this.method(channel, theClass.name, method.name, data, callback);
					}
				};
				this[theClass.name][method.name] = this[theClass.name][method.name].bind(this);
			});
		});
	}
	initializeFrameParserListeners() {
		this.frameParser.on('heartbeat', () => {
			this.emit('heartbeat');
		});
		this.frameParser.on('method', (channel, className, method, data) => {
			this.emit('heartbeat');
			this.emit('method', channel, className, method, data);
			this.emit(className + '.' + method.name, channel, method, data);
			this.emit(channel + ':' + className + '.' + method.name, channel, method, data);
		});
		this.frameParser.on('header', (channel, className, size, properties) => {
			this.emit('heartbeat');
			this.frameBodyClass[channel] = className;
			this.frameBodyBuffer[channel] = {
				'used': 0,
				'length': size,
				'buffers': [],
			};
			this.frameBodyProperties[channel] = properties;
			if (this.frameBodyBuffer[channel].used === this.frameBodyBuffer[channel].length) {
				var contentBuffer = Buffer.concat(this.frameBodyBuffer[channel].buffers);
				this.emit('content', channel, this.frameBodyClass[channel], this.frameBodyProperties[channel], contentBuffer);
				this.emit(channel + ':' + 'content', channel, this.frameBodyClass[channel], this.frameBodyProperties[channel], contentBuffer);
			}
		});
		this.frameParser.on('body', (channel, buffer) => {
			this.emit('heartbeat');
			this.frameBodyBuffer[channel].buffers.push(buffer);
			this.frameBodyBuffer[channel].used += buffer.length;
			if (this.frameBodyBuffer[channel].used === this.frameBodyBuffer[channel].length) {
				var contentBuffer = Buffer.concat(this.frameBodyBuffer[channel].buffers);
				this.emit('content', channel, this.frameBodyClass[channel], this.frameBodyProperties[channel], contentBuffer);
				this.emit(channel + ':' + 'content', channel, this.frameBodyClass[channel], this.frameBodyProperties[channel], contentBuffer);
			}
		});
	}
	clientProperties(serverPropertiesData) {
		var clientCapabilities = {};
		var serverCapabilities = serverPropertiesData['server-properties']['capabilities'];
		for (var capability in serverCapabilities) {
			if (serverCapabilities[capability]) {
				clientCapabilities[capability] = {
					type: 'Boolean',
					data: true
				};
			}
		}
		var clientProperties = {
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
	openAMQPCommunication() {
		var args = Array.prototype.slice.call(arguments);
		var username = 'guest';
		var password = 'guest';
		var heartbeat = true;
		var vhost = '/';
		var callback;
		if (args.length && typeof args[args.length - 1] === 'function') {
			callback = args.pop();
		}
		if (args.length) {
			username = args.shift();
		}
		if (args.length) {
			password = args.shift();
		}
		if (args.length) {
			heartbeat = args.shift();
		}
		if (args.length) {
			vhost = args.shift();
		}
		async.series([
			(seriesCallback) => {
				this.once('connection.start', (channel, method, data) => {
					this.connection['start-ok'](this.clientProperties(data), 'AMQPLAIN', {
						LOGIN: {
							type: 'Long string',
							data: username
						},
						PASSWORD: {
							type: 'Long string',
							data: password
						}
					}, 'en_US', () => {
						seriesCallback();
					});
				});
			}, (seriesCallback) => {
				this.once('connection.tune', (channel, method, data) => {
					this.setFrameMax(data['frame-max']);
					if (heartbeat) {
						if (heartbeat === true) {
							heartbeat = data.heartbeat;
						}
					} else {
						heartbeat = 0;
					}
					var channelMax = data['channel-max'];
					if (channelMax === 0) {
						channelMax = (1 << 16) - 1;
					}
					this.connection['tune-ok'](channelMax, data['frame-max'], heartbeat, () => {
						if (heartbeat && data.heartbeat) {
							this.heartbeatIntervalId = setInterval(() => {
								this.heartbeat((heartbeatError) => {
									if (heartbeatError) {
										this.emit('error', heartbeatError);
									}
								});
								if (this.heartbeatsMissed >= 2) {
									this.emit('error', new Error('oh no! server is not sending heartbeats!'));
								}
								this.heartbeatsMissed++;
							}, heartbeat * 1000);
							this.socket.once('close', () => {
								clearInterval(this.heartbeatIntervalId);
							});
							this.on('heartbeat', () => {
								this.heartbeatsMissed = 0;
							});
							this.heartbeatsMissed = 0;
						}
						seriesCallback();
					});
				});
			}, (seriesCallback) => {
				this.connection.open(vhost);
				this.once('connection.open-ok', () => {
					seriesCallback();
				});
			}, (seriesCallback) => {
				this.channel.open(1);
				this.on('1:channel.close', () => {
					this.channel['close-ok'](1, () => {
						this.channel.open(1);
					});
				});
				this.on('1:channel.flow', (channel, method, data) => {
					this.channel['flow-ok'](1, data.active, () => {
						if (data.active) {
							this.socket.resume();
						} else {
							this.socket.pause();
						}
					});
				});
				this.once('1:channel.open-ok', () => {
					seriesCallback();
				});
			}
		], callback);
	}
	closeAMQPCommunication(callback) {
		async.series([(seriesCallback) => {
			this.channel.close(1, 200, 'Closing channel');
			this.once('1:channel.close-ok', () => {
				seriesCallback();
			});
		}, (seriesCallback) => {
			this.connection.close(200, 'Closing channel');
			this.once('connection.close-ok', () => {
				seriesCallback();
			});
		}, (seriesCallback) => {
			clearInterval(this.heartbeatIntervalId);
			seriesCallback();
		}], callback);
	}
	setFrameMax(frameMax) {
		this.frameMax = frameMax;
		this.frameSerializer.frameMax = frameMax;
	}
	method(channel, className, methodName, data, callback) {
		if (this.socket.readyState !== 'open') {
			return callback(new Error('Socket is disconnected.'));
		}
		var frameBuffer = this.methodBuffer(channel, className, methodName, data);
		this.socket.write(frameBuffer, 'utf8', callback);
	}
	methodWithContent(channel, className, methodName, data, properties, content, callback) {
		if (this.socket.readyState !== 'open') {
			return callback(new Error('Socket is disconnected.'));
		}
		var frameBuffer = this.methodBuffer(channel, className, methodName, data);
		var frameBuffers = this.contentBuffer(channel, className, properties, content);
		frameBuffers.unshift(frameBuffer);
		this.socket.write(Buffer.concat(frameBuffers), 'utf8', callback);
	}
	content(channel, className, properties, content, callback) {
		if (this.socket.readyState !== 'open') {
			return callback(new Error('Socket is disconnected.'));
		}
		var frameBuffers = this.contentBuffer(channel, className, properties, content);
		async.eachSeries(frameBuffers, (frameBuffer, eachCallback) => {
			this.socket.write(frameBuffer, 'utf8', eachCallback);
		}, (eachError) => {
			callback(eachError);
		});
	}
	heartbeat(callback) {
		if (this.socket.readyState !== 'open') {
			return callback(new Error('Socket is disconnected.'));
		}
		var frameBuffer = this.heartbeatBuffer();
		this.socket.write(frameBuffer, 'utf8', callback);
	}
	methodBuffer(channel, className, methodName, data) {
		var frameBuffer = Buffer.alloc(this.frameMax);
		frameBuffer.used = 0;
		frameBuffer = this.frameSerializer.serializeFrameMethod(frameBuffer, channel, className, methodName, data);
		return frameBuffer.slice(0, frameBuffer.used);
	}
	contentBuffer(channel, className, properties, content) {
		var contentBuffer;
		if (typeof content === 'string') {
			contentBuffer = Buffer.from(content);
		} else if (content instanceof Buffer) {
			contentBuffer = content;
		}
		var frameBuffers = [];
		var frameHeaderBuffer = Buffer.alloc(this.frameMax);
		frameHeaderBuffer.used = 0;
		this.frameSerializer.serializeFrameContentHeader(frameHeaderBuffer, channel, className, contentBuffer.length, properties);
		frameBuffers.push(frameHeaderBuffer.slice(0, frameHeaderBuffer.used));
		var contentChunkStart = 0;
		var contentChunkEnd = 0;
		while (contentChunkEnd !== contentBuffer.length) {
			contentChunkStart = contentChunkEnd;
			contentChunkEnd = Math.min(contentBuffer.length, contentChunkStart + this.frameMax - 8);
			var frameBuffer = Buffer.alloc(this.frameMax);
			frameBuffer.used = 0;
			var contentChunk = contentBuffer.slice(contentChunkStart, contentChunkEnd);
			contentChunk.used = contentChunk.length;
			frameBuffer = this.frameSerializer.serializeFrameContentBody(frameBuffer, channel, contentChunk);
			frameBuffers.push(frameBuffer.slice(0, frameBuffer.used));
		}
		return frameBuffers;
	}
	heartbeatBuffer() {
		var frameBuffer = Buffer.alloc(this.frameMax);
		frameBuffer.used = 0;
		frameBuffer = this.frameSerializer.serializeFrameHeartbeat(frameBuffer);
		return frameBuffer.slice(0, frameBuffer.used);
	}
}
module.exports = ConnectionHandle;
