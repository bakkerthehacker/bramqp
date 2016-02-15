'use strict';
var util = require('util');
var vows = require('vows');
var assert = require('assert');
var net = require('net');
var bramqp = require('../lib/bramqp');
var puts = require('vows').console.puts({
	stream: process.stdout
});
var connectAMQP = function() {
	var self = this;
	var socket = net.connect({ host: 'localhost', port: 5672 });
	bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
		handle.openAMQPCommunication('guest', 'guest', true, function() {
			self.callback(null, handle);
		});
	});
};
var connectVerify = function(handle) {
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
