'use strict';
var async = require('async');
var util = require('util');
var vows = require('vows');
var assert = require('assert');
var net = require('net');
var bramqp = require('../lib/bramqp');
var puts = require('vows').console.puts({
	stream: process.stdout
});
var HANDLES = [];

function connectAMQP(i, callback) {
	var socket = net.connect({ host: 'localhost', port: 5672 });
	bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(error, handle) {
		handle.openAMQPCommunication('guest', 'guest', true, function() {
			HANDLES[i] = handle;
			callback();
		});
	});
}

function disconnectAMQP(i, callback) {
	var handle = HANDLES[i];
	handle.closeAMQPCommunication(function() {
		handle.socket.end();
	});
}

function connectAllSeries(callback) {
	async.eachSeries([0, 1, 2, 3, 4], connectAMQP, callback);
}
var exchangeDeclare = function(i) {
	return function() {
		var self = this;
		var handle = HANDLES[i];
		var ex = 'TestEX-' + i.toString();
		handle.exchange.declare(1, ex, 'direct', false, false, false, false, false, {}, function() {
			handle.once('1:exchange.declare-ok', function() {
				self.callback(null, i);
			});
		});
	};
};
var queueDeclare = function(i) {
	return function() {
		var self = this;
		var handle = HANDLES[i];
		var q = 'TestQ-' + i.toString();
		handle.queue.declare(1, q, false, function() {
			handle.once('1:queue.declare-ok', function() {
				self.callback(null, i);
			});
		});
	};
};
var verifyDeclare = function(i) {
	disconnectAMQP(i);
};
vows.describe('concurrent exchange declare').addBatch({
	'get connected...': {
		topic: function() {
			connectAllSeries(this.callback);
		},
		'exchange declare 0': {
			topic: exchangeDeclare(0),
			'check exchange declared': verifyDeclare
		},
		'exchange declare 1': {
			topic: exchangeDeclare(1),
			'check exchange declared': verifyDeclare
		},
		'exchange declare 2': {
			topic: exchangeDeclare(2),
			'check exchange declared': verifyDeclare
		},
		'exchange declare 3': {
			topic: exchangeDeclare(3),
			'check exchange declared': verifyDeclare
		},
		'exchange declare 4': {
			topic: exchangeDeclare(4),
			'check exchange declared': verifyDeclare
		}
	}
}).addBatch({
	'get connected...': {
		topic: function() {
			connectAllSeries(this.callback);
		},
		'queue declare 0': {
			topic: queueDeclare(0),
			'check queue declared': verifyDeclare
		},
		'queue declare 1': {
			topic: queueDeclare(1),
			'check queue declared': verifyDeclare
		},
		'queue declare 2': {
			topic: queueDeclare(2),
			'check queue declared': verifyDeclare
		},
		'queue declare 3': {
			topic: queueDeclare(3),
			'check queue declared': verifyDeclare
		},
		'queue declare 4': {
			topic: queueDeclare(4),
			'check queue declared': verifyDeclare
		}
	}
}).export(module);
