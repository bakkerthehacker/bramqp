'use strict';

var util = require('util');
var vows = require('vows');
var assert = require('assert');

var net = require('net');
var specification = require('../lib/specification');
var ConnectionHandle = require('../lib/connectionHandle');

var puts = require('vows').console.puts({
	stream : process.stdout
});

var connectAMQP = function() {
	return function () {
		var self = this;
		var socket = net.connect({host: 'localhost', port: 5672});
		socket.once('connect', function() {
			var spec = 'rabbitmq/full/amqp0-9-1.stripped.extended';
			var handle = new ConnectionHandle(socket, spec);

			var bail = setTimeout(function() {
				self.callback(false, handle);
			}, 5000);

			handle.once('init', function() {
				handle.openAMQPCommunication('guest', 'guest', true,
					function() {
						clearTimeout(bail);
						self.callback(true, handle);
					});
			});
		});
	};
};

var connectVerify = function() {
	return function(success, handle, error) {
		assert.strictEqual(success, true);
		handle.closeAMQPCommunication(function() {
			handle.socket.end();
		});
	};
};

vows.describe('concurrent connections').addBatch({
	'concurrent connection 1' : {
		topic : connectAMQP(),
		'should be connected' : connectVerify(),
	},
	'concurrent connection 2' : {
		topic : connectAMQP(),
		'should be connected' : connectVerify(),
	},
	'concurrent connection 3' : {
		topic : connectAMQP(),
		'should be connected' : connectVerify(),
	},
	'concurrent connection 4' : {
		topic : connectAMQP(),
		'should be connected' : connectVerify(),
	},
	'concurrent connection 5' : {
		topic : connectAMQP(),
		'should be connected' : connectVerify(),
	}
}).export(module);
