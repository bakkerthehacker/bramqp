var vows = require('vows');
var assert = require('assert');
var net = require('net');
var async = require('async');

var bramqp = require('../lib/bramqp');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows.describe('queue').addBatch({
	'A queue' : {
		'with default options' : {
			topic : function() {
				var self = this;
				bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
					if (error) {
						return self.callback(error);
					}
					var socket = net.connect({
						port : 5672
					});
					socket.on('error', self.callback);
					socket.on('connect', function() {
						bramqp.initializeSocket(socket, function(error, handle) {
							if (error) {
								return self.callback(error);
							}
							async.series([ function(seriesCallback) {
								handle.openAMQPCommunication(seriesCallback);
							}, function(seriesCallback) {
								handle.queue.declare(1, 'test-queue', function(error) {
									if (error) {
										return seriesCallback(error);
									}
									handle.once('queue.declare-ok', function(channel, method, data) {
										seriesCallback();
									});
								});
							} ], function(error) {
								self.callback(error, handle);
							});
						});
					});
				});
			},
			'with a message' : {
				topic : function(handle) {
					var self = this;
					async.series([ function(seriesCallback) {
						handle.basic.consume(1, 'test-queue', null, false, true, false, false, {}, seriesCallback);
					}, function(seriesCallback) {
						handle.once('basic.consume-ok', function(channel, method, data) {
							seriesCallback();
						});
					}, function(seriesCallback) {
						handle.on('basic.deliver', function(channel, method, data) {
							handle.once('content', function(channel, className, properties, content) {
								self.callback(null, {
									className : className,
									properties : properties,
									content : content
								});
							});
						});
						setImmediate(seriesCallback);
					}, function(seriesCallback) {
						handle.basic.publish(1, '', 'test-queue', false, false, function() {
							handle.content(1, 'basic', {}, 'Hello World!', seriesCallback);
						});
					} ], function(error) {
						if (error) {
							self.callback(error);
						}
					});
				},
				'should recieve the same message sent to it' : function(message) {
					assert.strictEqual(message.className, 'basic');
					assert.instanceOf(message.content, Buffer);
					assert.strictEqual(message.content.toString(), 'Hello World!');
					assert.isObject(message.properties);
					assert.isEmpty(message.properties);
				}
			}
		}
	}
}).export(module);
