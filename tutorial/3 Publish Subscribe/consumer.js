'use strict';

var bramqp = require('bramqp');
var net = require('net');
var async = require('async');

var queueName = '';

var socket = net.connect({
	port : 5672
});
bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
	async.series([ function(seriesCallback) {
		handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
	}, function(seriesCallback) {
		handle.exchange.declare(1, 'logs', 'fanout', false, false, true, false, false, {});
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
		handle.queue.bind(1, queueName, 'logs', null, false, {});
		handle.once('queue.bind-ok', function(channel, method, data) {
			console.log('queue bound sucessfully');
			seriesCallback();
		});
	}, function(seriesCallback) {
		handle.basic.consume(1, queueName, false, true, true, false, {});
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
