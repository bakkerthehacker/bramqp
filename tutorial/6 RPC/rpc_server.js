var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

var fib = function(n) {
	if (n === 0) {
		return 0;
	} else if (n === 1) {
		return 1;
	} else {
		return fib(n - 1) + fib(n - 2);
	}
};

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
				handle.queue.declare(1, 'rpc_queue');
				handle.once('queue.declare-ok', function(channel, method, data) {
					console.log('queue declared');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.basic.qos(1, 0, 1, false);
				handle.once('basic.qos-ok', function(channel, method, data) {
					console.log('qos updated');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.basic.consume(1, 'rpc_queue');
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
							var n = parseInt(content.toString(), 10);
							console.log(' [.] fib(' + n + ')');
							var response = fib(n);
							handle.basic.publish(1, '', properties['reply-to'], false, false, function() {
								handle.content(1, 'basic', {
									'correlation-id' : properties['correlation-id']
								}, response.toString(), function() {
									handle.basic.ack(1, data['delivery-tag']);
								});
							});
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
