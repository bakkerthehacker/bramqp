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
		handle.queue.declare(1, 'task_queue', false, true, false, false, false, {});
		handle.once('1:queue.declare-ok', function(channel, method, data) {
			console.log('queue declared');
			seriesCallback();
		});
	}, function(seriesCallback) {
		var args = process.argv.splice(2);
		var message = args.length ? args.join(' ') : 'Hello World!';
		handle.basic.publish(1, '', 'task_queue', false, false, function() {
			handle.content(1, 'basic', {
				delivery_mode: 2
			}, message, seriesCallback);
		});
	}, function(seriesCallback) {
		handle.closeAMQPCommunication(seriesCallback);
	}, function(seriesCallback) {
		handle.socket.end();
		setImmediate(seriesCallback);
	}], function() {
		console.log('all done');
	});
});
