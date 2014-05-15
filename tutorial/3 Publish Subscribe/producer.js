var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
	if (error) {
		console.log(error);
	}
	var exchangeName = 'logs';
	var exchangeType = 'fanout';

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
						var publishErrors = true;
						var routingKey = 'logKey';
						var queueMessages = false; // not supported by RabbitMQ
						handle.basic.publish(1, exchangeName, routingKey, publishErrors, queueMessages, function() {
							var contentType = 'basic';
							var properties = {};
							var content = '11-23-2013: some log';
							handle.content(1, contentType, properties, content, function() {
								console.log('message published');
								seriesCallback();
							});
						});
					}, function(seriesCallback) {
						handle.on('basic.return', function(replyCode, replyText, exchange, routingKey) {
							console.log('Message Returned from Server');
							console.log(replyCode);
							console.log(replyText);
							console.log(exchange);
						});
						seriesCallback();
					}, function(seriesCallback) {
						setTimeout(function() {
							console.log('close communication');
							handle.closeAMQPCommunication(seriesCallback);
						}, 10 * 1000);
					}, function(seriesCallback) {
						console.log('socket ended');
						handle.socket.end();
						setImmediate(seriesCallback);
					} ], function(err) {
				if (err) {
					console.log(err);
				}
				console.log('all done');
			});
		});
	});
});
