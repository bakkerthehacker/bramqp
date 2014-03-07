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
				handle.exchange.declare(1, 'direct_logs', 'direct');
				handle.once('exchange.declare-ok', function(channel, method, data) {
					console.log('exchange declared');
					seriesCallback();
				});
			}, function(seriesCallback) {
				var args = process.argv.splice(2);
				var severity = args.length ? args.shift() : 'info';
				var message = args.length ? args.join(' ') : 'Hello World!';
				handle.basic.publish(1, 'direct_logs', severity, false, false, function() {
					handle.content(1, 'basic', {}, message, seriesCallback);
				});
			}, function(seriesCallback) {
				handle.closeAMQPCommunication(seriesCallback);
			}, function(seriesCallback) {
				handle.socket.end();
				setImmediate(seriesCallback);
			} ], function() {
				console.log('all done');
			});
		});
	});
});
