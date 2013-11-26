var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

var tempQueueName;

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
				handle.exchange.declare(1, 'topic_logs', 'topic');
				handle.once('exchange.declare-ok', function(channel, method, data) {
					console.log('exchange declared');
					seriesCallback();
				});
			}, function(seriesCallback) {
				handle.queue.declare(1, '', false, false, true, false, false, {});
				handle.once('queue.declare-ok', function(channel, method, data) {
					console.log('queue declared');
					console.log(data);
					tempQueueName = data.queue;
					var args = process.argv.splice(2);
					if (!args.length) {
						console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' [binding key]...');
						process.exit(1);
					}
					async.each(args, function(bindingKey, eachCallback) {
						handle.queue.bind(1, data.queue, 'topic_logs', bindingKey, false, {});
						handle.once('queue.bind-ok', function() {
							console.log('queue ' + tempQueueName + ' bound to topic_logs');
							eachCallback();
						});
					}, seriesCallback);
				});
			}, function(seriesCallback) {
				handle.basic.consume(1, tempQueueName, null, false, true, false, false, {});
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
