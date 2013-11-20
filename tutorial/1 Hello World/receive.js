var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
	if (error) {
		console.log(error);
	}
	var socket = net.connect({
		port : 5672
	}, function() {
		bramqp.initializeSocket(socket, function(error, handle) {
			async.series([ function(seriesCallback) {
				handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
			}, function(seriesCallback) {
				handle.queue.declare(1, 'hello');
				handle.once('queue.declare-ok', function(channel, method, data) {
					console.log('queue declared');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.basic.consume(1, 'hello', null, false, true, false, false, {});
				handle.once('basic.consume-ok', function(channel, method, data) {
					console.log('consuming from queue');
					console.log(data);
					handle.on('basic.deliver', function(channel, method, data) {
						console.log('incoming message');
						console.log(data);
						handle.once('content', function(channel, className, properties, content) {
							console.log('got a message:');
							console.log(content.toString());
							console.log('with properties:');
							console.log(properties);
						});
					});
					seriesCallback();
				});
			} ], function() {
				console.log('all done');
			});
		});
	});
});
