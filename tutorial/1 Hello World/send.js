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
				handle.basic.publish(1, '', 'hello', false, false, function() {
					handle.content(1, 'basic', {}, 'Hello World!', seriesCallback);
				});
			}, function(seriesCallback) {
				setTimeout(function() {
					handle.closeAMQPCommunication(seriesCallback);
				}, 10 * 1000);
			}, function(seriesCallback) {
				handle.socket.end();
				setImmediate(seriesCallback);
			} ], function() {
				console.log('all done');
			});
		});
	});
});
