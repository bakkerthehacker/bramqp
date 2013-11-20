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
				handle.basic.qos(1, 0, 1, false);
				handle.once('basic.qos-ok', function(channel, method, data) {
					console.log('qos accepted');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.queue.declare(1, 'task_queue', false, true, false, false, false, {});
				handle.once('queue.declare-ok', function(channel, method, data) {
					console.log('queue declared');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.basic.consume(1, 'task_queue', null, false, false, false, false, {});
				handle.once('basic.consume-ok', function(channel, method, data) {
					console.log('consuming from queue');
					console.log(data);
					handle.on('basic.deliver', function(channel, method, data) {
						console.log('incomming message');
						console.log(data);
						handle.once('content', function(channel, className, properties, content) {
							console.log('got a message:');
							console.log(content.toString());
							console.log('with properties:');
							console.log(properties);
							setTimeout(function() {
								console.log('acking');
								handle.basic.ack(1, data['delivery-tag']);
							}, content.length * 1000);
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
