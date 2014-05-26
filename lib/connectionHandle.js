var util = require('util');
var async = require('async');
var events = require('events');

var FrameParser = require('./frameParser');
var FrameSerializer = require('./frameSerializer');
var specification = require('./specification');

var ConnectionHandle = module.exports = function ConnectionHandle(socket) {
	var self = this;
	self.socket = socket;
};

util.inherits(ConnectionHandle, events.EventEmitter);

ConnectionHandle.prototype.initializeSpec = function(callback) {
	var self = this;
	specification.getSpecification(function(spec) {
		self.specData = spec;
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
				var errorMessage = 'Server does not support AMQP version ' + self.specData.amqp.major + '-'
						+ self.specData.amqp.minor + '-' + self.specData.amqp.revision
						+ '. The server suggests version ' + data[5] + '-' + data[6] + '-' + data[7];
				var error = new Error(errorMessage);
				self.emit('error', error);
			} else {
				self.frameParser.parse(data);
			}
		});

		self.socket.on('error', function(error) {
			self.emit('error', error);
		});

		self.socket.write('AMQP'
				+ String.fromCharCode(0, self.specData.amqp.major, self.specData.amqp.minor,
						self.specData.amqp.revision), callback);

	});
};

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

					if (args.length && typeof args[args.length - 1] === 'function') {
						callback = args.pop();
					}

					if (args.length && classLocal.handler === 'channel') {
						channel = args.shift();
					}

					var data = {};
					if (methodLocal.field) {
						var reservedFields = 0;
						for ( var i in methodLocal.field) {
							if (methodLocal.field[i].reserved) {
								reservedFields++;
							} else {
								data[methodLocal.field[i].name] = args[i - reservedFields];
							}
						}
					}
					self.method(channel, classLocal.name, methodLocal.name, data, callback);
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
	});

	self.frameParser.on('header', function(channel, className, size, properties) {
		self.emit('heartbeat');
		self.frameBodyClass[channel] = className;
		self.frameBodyBuffer[channel] = new Buffer(size);
		self.frameBodyBuffer[channel].used = 0;
		self.frameBodyProperties[channel] = properties;
		if (self.frameBodyBuffer[channel].used === self.frameBodyBuffer[channel].length) {
			self.emit('content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel],
					self.frameBodyBuffer[channel]);
		}
	});

	self.frameParser.on('body', function(channel, buffer) {
		self.emit('heartbeat');
		buffer.copy(self.frameBodyBuffer[channel], self.frameBodyBuffer[channel].used);
		self.frameBodyBuffer[channel].used += buffer.length;
		if (self.frameBodyBuffer[channel].used === self.frameBodyBuffer[channel].length) {
			self.emit('content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel],
					self.frameBodyBuffer[channel]);
		}
	});
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
				self.once('connection.start', function() {
					self.connection['start-ok'](null, 'AMQPLAIN', {
						LOGIN : {
							type : 'Long string',
							data : username
						},
						PASSWORD : {
							type : 'Long string',
							data : password
						}
					}, 'en_US', function() {
						seriesCallback();
					});
				});
			},
			function(seriesCallback) {
				self.once('connection.tune', function(channel, method, data) {
					self.setFrameMax(data['frame-max']);
					self.connection['tune-ok'](data['channel-max'], data['frame-max'], heartbeat ? data.heartbeat : 0,
							function() {
								if (heartbeat) {
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
									}, data.heartbeat * 1000);

									self.on('heartbeat', function() {
										self.heartbeatsMissed = 0;
									});
									self.heartbeatsMissed = 0;
								}
								seriesCallback();
							});
				});
			}, function(seriesCallback) {
				self.connection.open(vhost);

				self.once('connection.open-ok', function() {
					seriesCallback();
				});

			}, function(seriesCallback) {
				self.channel.open(1);

				self.on('channel.close', function() {
					self.channel['close-ok'](1, function() {
						self.channel.open(1);
					});
				});

				self.on('channel.flow', function(channel, method, data) {
					self.channel['flow-ok'](1, data.active, function() {
						if (data.active) {
							self.socket.resume();
						} else {
							self.socket.pause();
						}
					});
				});

				self.once('channel.open-ok', function() {
					seriesCallback();
				});
			} ], callback);
};

ConnectionHandle.prototype.closeAMQPCommunication = function(callback) {
	var self = this;

	async.series([ function(seriesCallback) {
		self.channel.close(1);

		self.once('channel.close-ok', function() {
			seriesCallback();
		});
	}, function(seriesCallback) {
		self.connection.close();

		self.once('connection.close-ok', function() {
			seriesCallback();
		});
	}, function(seriesCallback) {
		clearTimeout(self.heartbeatIntervalId);
		setImmediate(seriesCallback);
	} ], callback);
};

ConnectionHandle.prototype.setFrameMax = function(frameMax) {
	this.frameMax = frameMax;
	this.frameSerializer.frameMax = frameMax;
};

ConnectionHandle.prototype.method = function(channel, className, methodName, data, callback) {
	var frameBuffer = new Buffer(this.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameMethod(frameBuffer, channel, className, methodName, data);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', callback);
};

ConnectionHandle.prototype.content = function(channel, className, properties, content, callback) {

	var contentBuffer;
	var self = this;

	if (typeof content === 'string') {
		contentBuffer = new Buffer(content);
	} else if (content instanceof Buffer) {
		contentBuffer = content;
	} else {
		return callback(new Error('content must be of type string or buffer'));
	}

	var frameBuffer = new Buffer(this.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameContentHeader(frameBuffer, channel, className, contentBuffer.length, properties);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', function() {
		var contentChunkStart = 0;
		var contentChunkEnd = 0;

		async.whilst(function() {
			return contentChunkEnd !== contentBuffer.length;
		}, function(whilstCallback) {
			contentChunkStart = contentChunkEnd;
			contentChunkEnd = Math.min(contentBuffer.length, contentChunkStart + self.frameMax - 8);

			frameBuffer.used = 0;

			var contentChunk = contentBuffer.slice(contentChunkStart, contentChunkEnd);
			contentChunk.used = contentChunk.length;

			self.frameSerializer.serializeFrameContentBody(frameBuffer, channel, contentChunk);

			self.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', whilstCallback);

		}, function(whilstError) {
			if (callback) {
				callback(whilstError);
			}
		});
	});
};

ConnectionHandle.prototype.heartbeat = function(callback) {
	var frameBuffer = new Buffer(this.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameHeartbeat(frameBuffer);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', callback);
};
