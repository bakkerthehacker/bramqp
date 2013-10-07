var net = require('net');
var util = require('util');
var fs = require('fs');
var async = require('async');
var events = require('events');

var FrameParser = require('./frameParser');
var FrameSerializer = require('./frameSerializer');
var specification = require('./specification');

var ConnectionHandle = function ConnectionHandle(socket) {
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
		self.frameBodyBuffer = {};
		self.frameBodyProperties = {};
		self.frameBodyClass = {};

		self.frameParser.on('error', function(error) {
			console.log('Frame Parser error:');
			console.log(error);
		});

		self.frameSerializer.on('error', function(error) {
			console.log('Frame Serializer error:');
			console.log(error);
		});

		self.initializeFrameParserListeners();

		self.socket.once('data', function(data) {
			self.socket.on('data', function(data) {
				self.frameParser.parse(data);
			});
			if (data.slice(0, 4) == 'AMQP') {
				var errorMessage = "Server does not support AMQP version " + self.specData.amqp.major + "-"
						+ self.specData.amqp.minor + "-" + self.specData.amqp.revision
						+ ". The server suggests version " + data[5] + "-" + data[6] + "-" + data[7];
				console.log(errorMessage);
			} else {
				self.frameParser.parse(data);
			}
		});

		self.socket.on('error', function(error) {
			console.log(util.inspect(error));
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
			// if (method.name.indexOf('-') != -1) {
			// self[theClass.name][method.name.replace('-', '')] =
			// methodFunction;
			// }
		});
	});
};

ConnectionHandle.prototype.initializeFrameParserListeners = function() {
	var self = this;

	self.frameParser.on('method', function(channel, className, method, data) {
		self.emit('method', channel, className, method, data);
		self.emit(className + '.' + method.name, channel, method, data);
	});

	self.frameParser.on('header', function(channel, className, size, properties) {
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
		buffer.copy(self.frameBodyBuffer[channel], self.frameBodyBuffer[channel].used);
		self.frameBodyBuffer[channel].used += buffer.length;
		if (self.frameBodyBuffer[channel].used === self.frameBodyBuffer[channel].length) {
			self.emit('content', channel, self.frameBodyClass[channel], self.frameBodyProperties[channel],
					self.frameBodyBuffer[channel]);
		}
	});
};

ConnectionHandle.prototype.method = function(channel, className, methodName, data, callback) {
	var frameBuffer = new Buffer(this.frameSerializer.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameMethod(frameBuffer, channel, className, methodName, data);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', callback);
};

ConnectionHandle.prototype.content = function(channel, className, properties, content, callback) {

	var contentBuffer;
	var self = this;

	if (typeof content === 'string') {
		contentBuffer = new Buffer(content);
	} else {
		contentBuffer = content;
	}

	var frameBuffer = new Buffer(this.frameSerializer.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameContentHeader(frameBuffer, channel, className, contentBuffer.length, properties);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', function() {
		var contentChunkStart = 0;
		var contentChunkEnd = 0;

		async.whilst(function() {
			return contentChunkEnd !== contentBuffer.length;
		}, function(whilstCallback) {
			contentChunkStart = contentChunkEnd;
			contentChunkEnd = Math.min(contentBuffer.length, contentChunkStart + self.frameSerializer.frameMax - 8);

			frameBuffer.used = 0;

			var contentChunk = contentBuffer.slice(contentChunkStart, contentChunkEnd);
			contentChunk.used = contentChunk.length;

			self.frameSerializer.serializeFrameContentBody(frameBuffer, channel, contentChunk);

			self.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', whilstCallback);

			// TODO continue
		}, callback);
	});
};

ConnectionHandle.prototype.heartbeat = function(callback) {
	var frameBuffer = new Buffer(this.frameSerializer.frameMax);
	frameBuffer.used = 0;

	this.frameSerializer.serializeFrameHeartbeat(frameBuffer);

	this.socket.write(frameBuffer.slice(0, frameBuffer.used), 'utf8', callback);
};

exports.selectSpecification = function(path, callback) {
	specification.selectSpecification(path, callback);
};

exports.initializeSocket = function(socket, callback) {
	var handle = new ConnectionHandle(socket);
	handle.initializeSpec(function(error) {
		callback(error, handle);
	});
};
