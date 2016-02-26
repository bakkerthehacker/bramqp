'use strict';
var util = require('util');
var async = require('async');
var events = require('events');
var FrameParser = require('./frameParser');
var FrameSerializer = require('./frameSerializer');
var specification = require('./specification');
var ConnectionHandle = module.exports = function ConnectionHandle(socket, specPath) {
	var self = this;
	self.socket = socket;
	specification.fetchSpecification(specPath, function(error, specification) {
		if (error) {
			return self.emit('error', error);
		}
		self.specData = specification;
		self.initializeMethodFunctions();
		self.frameParser = new FrameParser(self.specData);
		self.frameSerializer = new FrameSerializer(self.specData);
		self.frameMax = self.frameSerializer.frameMax;
		self.frameBodyBuffer = {};
		self.frameBodyProperties = {};
		self.frameBodyClass = {};
		self.frameParser.on('error', function(error) {
			self.emit('error', error);
		});
		self.frameSerializer.on('error', function(error) {
			self.emit('error', error);
		});
		self.initializeFrameParserListeners();
		self.socket.once('data', function(data) {
			self.socket.on('data', function(data) {
				self.frameParser.parse(data);
			});
			if (data.slice(0, 4) === 'AMQP') {
				var errorMessage = 'Server does not support AMQP version ' + self.specData.amqp.major + '-' + self.specData.amqp.minor + '-' + self.specData.amqp.revision + '. ' + 'The server suggests version ' + data[5] + '-' + data[6] + '-' + data[7] + '. ';
				var error = new Error(errorMessage);
				self.emit('error', error);
			} else {
				self.frameParser.parse(data);
			}
		});
		self.socket.on('error', function(error) {
			if (error.code === 'ECONNRESET') {
				self.emit('ECONNRESET', error);
			} else {
				self.emit('error', error);
			}
		});
		self.socket.write('AMQP' + String.fromCharCode(0, self.specData.amqp.major, self.specData.amqp.minor, self.specData.amqp.revision), function() {
			self.emit('init');
		});
	});
};
util.inherits(ConnectionHandle, events.EventEmitter);
ConnectionHandle.prototype.initializeMethodFunctions = function() {
	var self = this;
	self.specData.amqp['class'].forEach(function(theClass) {
		self[theClass.name] = {};
		theClass.method.forEach(function(method) {
			var methodFunction = (function(classLocal, methodLocal) {
				return function() {
					var args = Array.prototype.slice.call(arguments);
					var callback;
					var channel = 0;
					var properties;
					var content;
					if (args.length && typeof args[args.length - 1] === 'function') {
						callback = args.pop();
					}
					if (args.length && classLocal.handler === 'channel') {
						channel = args.shift();
					}
					var data = {};
					if (methodLocal.field) {
						var reservedFields = 0;
						for (var i in methodLocal.field) {
							if (methodLocal.field[i].reserved) {
								reservedFields++;
							} else {
								data[methodLocal.field[i].name] = args.shift();
							}
						}
					}
					if (args.length >= 2) {
						properties = args.shift();
						content = args.shift();
					}
					if (content && methodLocal.content === '1') {
						self.methodWithContent(channel, classLocal.name, methodLocal.name, data, properties, content, callback);
					} else {
						self.method(channel, classLocal.name, methodLocal.name, data, callback);
					}
				};
			})(theClass, method);
			self[theClass.name][method.name] = methodFunction;
		});
	});
};
ConnectionHandle.prototype.initializeFrameParserListeners = function() {
	var self = this;
	self.frameParser.on('heartbeat', function() {
		self.emit('heartbeat');
	});
	self.frameParser.on('method', function(channel, className, method, data) {
		self.emit('heartbeat');
		self.emit('method', channel, className, method, data);
		self.emit(className + '.' + method.name, channel, method, data);
		self.emit(channel + ':' + className + '.' + method.name, channel, method, data);
	});
	self.frameParser.on('header', function(channel, className, size, properties) {
		self.emit('heartbeat');
		self.frameBodyClass[channel] = className;
		self.frameBodyBuffer[channel] = new Buffer(size);
		self.frameBodyBuffer[channel].used = 0;
		self.frameBodyProperties[channel] = properties;
		if (self.frameBodyBuffer[channel].used === self.frameBodyBuffer[channel].length) {
			self.emit('content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel], self.frameBodyBuffer[channel]);
			self.emit(channel + ':' + 'content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel], self.frameBodyBuffer[channel]);
		}
	});
	self.frameParser.on('body', function(channel, buffer) {
		self.emit('heartbeat');
		buffer.copy(self.frameBodyBuffer[channel], self.frameBodyBuffer[channel].used);
		self.frameBodyBuffer[channel].used += buffer.length;
		if (self.frameBodyBuffer[channel].used === self.frameBodyBuffer[channel].length) {
			self.emit('content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel], self.frameBodyBuffer[channel]);
			self.emit(channel + ':' + 'content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel], self.frameBodyBuffer[channel]);
		}
	});
};
ConnectionHandle.prototype.clientProperties = function(serverPropertiesData) {
	var self = this;
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
};
ConnectionHandle.prototype.openAMQPCommunication = function() {
	var self = this;
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
		function(seriesCallback) {
			self.once('connection.start', function(channel, method, data) {
				self.connection['start-ok'](self.clientProperties(data), 'AMQPLAIN', {
					LOGIN: {
						type: 'Long string',
						data: username
					},
					PASSWORD: {
						type: 'Long string',
						data: password
					}
				}, 'en_US', function() {
					seriesCallback();
				});
			});
		},
		function(seriesCallback) {
			self.once('connection.tune', function(channel, method, data) {
				self.setFrameMax(data['frame-max']);
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
				self.connection['tune-ok'](channelMax, data['frame-max'], heartbeat, function() {
					if (heartbeat && data.heartbeat) {
						self.heartbeatIntervalId = setInterval(function() {
							self.heartbeat(function(heartbeatError) {
								if (heartbeatError) {
									self.emit('error', heartbeatError);
								}
							});
							if (self.heartbeatsMissed >= 2) {
								self.emit('error', new Error('oh no! server is not sending heartbeats!'));
							}
							self.heartbeatsMissed++;
						}, heartbeat * 1000);
						self.socket.once('close', function() {
							clearInterval(self.heartbeatIntervalId);
						});
						self.on('heartbeat', function() {
							self.heartbeatsMissed = 0;
						});
						self.heartbeatsMissed = 0;
					}
					seriesCallback();
				});
			});
		},
		function(seriesCallback) {
			self.connection.open(vhost);
			self.once('connection.open-ok', function() {
				seriesCallback();
			});
		},
		function(seriesCallback) {
			self.channel.open(1);
			self.on('1:channel.close', function() {
				self.channel['close-ok'](1, function() {
					self.channel.open(1);
				});
			});
			self.on('1:channel.flow', function(channel, method, data) {
				self.channel['flow-ok'](1, data.active, function() {
					if (data.active) {
						self.socket.resume();
					} else {
						self.socket.pause();
					}
				});
			});
			self.once('1:channel.open-ok', function() {
				seriesCallback();
			});
		}
	], callback);
};
ConnectionHandle.prototype.closeAMQPCommunication = function(callback) {
	var self = this;
	async.series([function(seriesCallback) {
		self.channel.close(1, 200, 'Closing channel');
		self.once('1:channel.close-ok', function() {
			seriesCallback();
		});
	}, function(seriesCallback) {
		self.connection.close(200, 'Closing channel');
		self.once('connection.close-ok', function() {
			seriesCallback();
		});
	}, function(seriesCallback) {
		clearInterval(self.heartbeatIntervalId);
		seriesCallback();
	}], callback);
};
ConnectionHandle.prototype.setFrameMax = function(frameMax) {
	this.frameMax = frameMax;
	this.frameSerializer.frameMax = frameMax;
};
ConnectionHandle.prototype.method = function(channel, className, methodName, data, callback) {
	if (this.socket.readyState !== 'open') {
		return callback(new Error('Socket is disconnected.'));
	}
	var frameBuffer = this.methodBuffer(channel, className, methodName, data);
	this.socket.write(frameBuffer, 'utf8', callback);
};
ConnectionHandle.prototype.methodWithContent = function(channel, className, methodName, data, properties, content, callback) {
	if (this.socket.readyState !== 'open') {
		return callback(new Error('Socket is disconnected.'));
	}
	var frameBuffer = this.methodBuffer(channel, className, methodName, data);
	var frameBuffers = this.contentBuffer(channel, className, properties, content);
	frameBuffers.unshift(frameBuffer);
	this.socket.write(Buffer.concat(frameBuffers), 'utf8', callback);
};
ConnectionHandle.prototype.content = function(channel, className, properties, content, callback) {
	var self = this;
	if (self.socket.readyState !== 'open') {
		return callback(new Error('Socket is disconnected.'));
	}
	var frameBuffers = this.contentBuffer(channel, className, properties, content);
	async.eachSeries(frameBuffers, function(frameBuffer, eachCallback) {
		self.socket.write(frameBuffer, 'utf8', eachCallback);
	}, function(eachError) {
		callback(eachError);
	});
};
ConnectionHandle.prototype.heartbeat = function(callback) {
	if (this.socket.readyState !== 'open') {
		return callback(new Error('Socket is disconnected.'));
	}
	var frameBuffer = this.heartbeatBuffer();
	this.socket.write(frameBuffer, 'utf8', callback);
};
ConnectionHandle.prototype.methodBuffer = function(channel, className, methodName, data) {
	var frameBuffer = new Buffer(this.frameMax);
	frameBuffer.used = 0;
	this.frameSerializer.serializeFrameMethod(frameBuffer, channel, className, methodName, data);
	return frameBuffer.slice(0, frameBuffer.used);
};
ConnectionHandle.prototype.contentBuffer = function(channel, className, properties, content) {
	var contentBuffer;
	var self = this;
	if (typeof content === 'string') {
		contentBuffer = new Buffer(content);
	} else if (content instanceof Buffer) {
		contentBuffer = content;
	}
	var frameBuffers = [];
	var frameHeaderBuffer = new Buffer(this.frameMax);
	frameHeaderBuffer.used = 0;
	this.frameSerializer.serializeFrameContentHeader(frameHeaderBuffer, channel, className, contentBuffer.length, properties);
	frameBuffers.push(frameHeaderBuffer.slice(0, frameHeaderBuffer.used));
	var contentChunkStart = 0;
	var contentChunkEnd = 0;
	while (contentChunkEnd !== contentBuffer.length) {
		contentChunkStart = contentChunkEnd;
		contentChunkEnd = Math.min(contentBuffer.length, contentChunkStart + self.frameMax - 8);
		var frameBuffer = new Buffer(this.frameMax);
		frameBuffer.used = 0;
		var contentChunk = contentBuffer.slice(contentChunkStart, contentChunkEnd);
		contentChunk.used = contentChunk.length;
		self.frameSerializer.serializeFrameContentBody(frameBuffer, channel, contentChunk);
		frameBuffers.push(frameBuffer.slice(0, frameBuffer.used));
	}
	return frameBuffers;
};
ConnectionHandle.prototype.heartbeatBuffer = function() {
	var frameBuffer = new Buffer(this.frameMax);
	frameBuffer.used = 0;
	this.frameSerializer.serializeFrameHeartbeat(frameBuffer);
	return frameBuffer.slice(0, frameBuffer.used);
};
