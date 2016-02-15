'use strict';
var bramqp = require('bramqp');
var net = require('net');
var async = require('async');
var socket = net.connect({
	port: 5672
});
bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
	async.series([function(seriesCallback) {
		handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
	}, function(seriesCallback) {
		handle.exchange.declare(1, 'logs', 'fanout', false, false, true, false, false, {});
		handle.once('1:exchange.declare-ok', function(channel, method, data) {
			console.log('exchange declared');
			seriesCallback();
		});
	}, function(seriesCallback) {
		handle.basic.publish(1, 'logs', 'logKey', true, false, function() {
			handle.content(1, 'basic', {}, 'basic', function() {
				console.log('message published');
				seriesCallback();
			});
		});
	}, function(seriesCallback) {
		handle.on('1:basic.return', function(replyCode, replyText, exchange, routingKey) {
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
	}], function(err) {
		if (err) {
			console.log(err);
		}
		console.log('all done');
	});
});
