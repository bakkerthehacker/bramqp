'use strict';
const vows = require('vows');
const assert = require('assert');
const net = require('net');
const async = require('async');
const bramqp = require('../lib/bramqp');
const puts = require('vows').console.puts({
	stream: process.stdout
});
vows.describe('queue').addBatch({
	'A queue': {
		'with default options': {
			topic: function() {
				const self = this;
				const socket = net.connect({
					port: 5672
				});
				bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
					if (error) {
						return self.callback(error);
					}
					async.series([function(seriesCallback) {
						handle.openAMQPCommunication(seriesCallback);
					}, function(seriesCallback) {
						handle.queue.declare(1, 'test-queue', function(error) {
							if (error) {
								return seriesCallback(error);
							}
							handle.once('1:queue.declare-ok', function(channel, method, data) {
								seriesCallback();
							});
						});
					}], function(error) {
						self.callback(error, handle);
					});
				});
			},
			'with a message': {
				topic: function(handle) {
					const self = this;
					async.series([function(seriesCallback) {
						handle.basic.consume(1, 'test-queue', null, false, true, false, false, {}, seriesCallback);
					}, function(seriesCallback) {
						handle.once('1:basic.consume-ok', function(channel, method, data) {
							seriesCallback();
						});
					}, function(seriesCallback) {
						handle.on('1:basic.deliver', function(channel, method, data) {
							handle.once('1:content', function(channel, className, properties, content) {
								self.callback(null, {
									className: className,
									properties: properties,
									content: content
								});
							});
						});
						setImmediate(seriesCallback);
					}, function(seriesCallback) {
						handle.basic.publish(1, '', 'test-queue', false, false, {}, 'Hello World!', seriesCallback);
					}, function(seriesCallback) {
						handle.closeAMQPCommunication(function() {
							handle.socket.end();
						});
					}], function(error) {
						if (error) {
							self.callback(error);
						}
					});
				},
				'should recieve the same message sent to it': function(message) {
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
