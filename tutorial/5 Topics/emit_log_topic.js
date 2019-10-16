'use strict';
const bramqp = require('bramqp');
const net = require('net');
const async = require('async');
const socket = net.connect({
	port: 5672
});
bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
	async.series([function(seriesCallback) {
		handle.openAMQPCommunication('guest', 'guest', true, seriesCallback);
	}, function(seriesCallback) {
		handle.exchange.declare(1, 'topic_logs', 'topic');
		handle.once('1:exchange.declare-ok', function(channel, method, data) {
			console.log('exchange declared');
			seriesCallback();
		});
	}, function(seriesCallback) {
		const args = process.argv.splice(2);
		const severity = args.length ? args.shift() : 'info';
		const message = args.length ? args.join(' ') : 'Hello World!';
		handle.basic.publish(1, 'topic_logs', severity, false, false, function() {
			handle.content(1, 'basic', {}, message, seriesCallback);
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
