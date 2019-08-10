'use strict';
const bramqp = require('bramqp');
const net = require('net');
const async = require('async');
const FibonacciRpcClient = function(callback) {
	const self = this;
	const socket = net.connect({
		port: 5672
	});
	bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
		self.handle = handle;
		async.series([function(seriesCallback) {
			self.handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
		}, function(seriesCallback) {
			self.handle.queue.declare(1, '', false, false, true, false, false, {});
			self.handle.once('1:queue.declare-ok', function(channel, method, data) {
				console.log('queue declared');
				self.callbackQueue = data.queue;
				seriesCallback();
			});
		}, function(seriesCallback) {
			self.handle.basic.consume(1, self.callbackQueue, null, false, true, false, false, {});
			self.handle.once('1:basic.consume-ok', function(channel, method, data) {
				console.log('consuming from queue');
				console.log(data);
				self.handle.on('1:basic.deliver', function(channel, method, data) {
					console.log('incomming message');
					console.log(data);
					self.handle.once('content', function(channel, className, properties, content) {
						console.log('got a message:');
						console.log(content.toString());
						console.log('with properties:');
						console.log(properties);
						if (self.corrId === properties['correlation-id']) {
							self.response = content.toString();
						}
					});
				});
				seriesCallback();
			});
		}], function() {
			console.log('all done');
			callback();
		});
	});
};
FibonacciRpcClient.prototype.call = function(n, returnCallback) {
	const self = this;
	self.response = null;
	self.corrId = Math.random().toString();
	self.handle.basic.publish(1, '', 'rpc_queue', false, false, function() {
		self.handle.content(1, 'basic', {
			'reply-to': self.callbackQueue,
			'correlation-id': self.corrId
		}, n.toString(), function() {
			const pollResponse = function() {
				if (self.response) {
					returnCallback(parseInt(self.response, 10));
				} else {
					setImmediate(pollResponse);
				}
			};
			setImmediate(pollResponse);
		});
	});
};
const fibonacciRpc = new FibonacciRpcClient(function() {
	console.log(' [x] Requesting fib(30)');
	fibonacciRpc.call(30, function(response) {
		console.log(' [.] Got ' + response);
	});
});
