var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
	if (error) {
		console.log(error);
	}
	var exchangeName = 'logs';
	var exchangeType = 'fanout';
	var queueName = '';
	var socket = net.connect({
		port : 5672
	}, function() {
		bramqp.initializeSocket(socket, function(error, handle) {
			async.series([
					function(seriesCallback) {
						handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
					},
					function(seriesCallback) {
						var passive = false;
						var durable = false;
						var autoDelete = true;
						var internal = false;
						var noWait = false;
						var arguments = {};
						handle.exchange.declare(1, exchangeName, exchangeType, passive, durable, autoDelete, internal,
								noWait, arguments);
						handle.once('exchange.declare-ok', function(channel, method, data) {
							console.log('exchange declared');
							seriesCallback();
						});
					}, function(seriesCallback) {

						handle.queue.declare(1, null, false, false, false, true, false, {});
						handle.once('queue.declare-ok', function(channel, method, data) {
							console.log('queue declared');
							queueName = data.queue;
							seriesCallback();
						});
					}, function(seriesCallback) {
						handle.queue.bind(1, queueName, exchangeName, null, false, {});
						handle.once('queue.bind-ok', function(channel, method, data) {
							console.log('queue bound sucessfully');
							seriesCallback();
						});
					}, function(seriesCallback) {

						var consumerTag = null;
						var noLocal = false;
						var noAck = true;
						var exclusive = true;
						var noWait = false;
						var arguments = false;

						handle.basic.consume(1, queueName, noLocal, noAck, exclusive, noWait, arguments, {});
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
									seriesCallback();
								});
							});
						});
					} ], function() {
				console.log('all done');
			});
		});
	});
});
