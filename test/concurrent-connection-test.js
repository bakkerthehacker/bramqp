'use strict';
const util = require('util');
const vows = require('vows');
const assert = require('assert');
const net = require('net');
const bramqp = require('../lib/bramqp');
const puts = require('vows').console.puts({
	stream: process.stdout
});
const connectAMQP = function() {
	const self = this;
	const socket = net.connect({ host: 'localhost', port: 5672 });
	bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
		handle.openAMQPCommunication('guest', 'guest', true, function() {
			self.callback(null, handle);
		});
	});
};
const connectVerify = function(handle) {
	handle.closeAMQPCommunication(function() {
		handle.socket.end();
	});
};
vows.describe('concurrent connections').addBatch({
	'concurrent connection 1': {
		topic: connectAMQP,
		'should be connected': connectVerify,
	},
	'concurrent connection 2': {
		topic: connectAMQP,
		'should be connected': connectVerify,
	},
	'concurrent connection 3': {
		topic: connectAMQP,
		'should be connected': connectVerify,
	},
	'concurrent connection 4': {
		topic: connectAMQP,
		'should be connected': connectVerify,
	},
	'concurrent connection 5': {
		topic: connectAMQP,
		'should be connected': connectVerify,
	}
}).export(module);
