'use strict';

var async = require('async');
var util = require('util');
var vows = require('vows');
var assert = require('assert');

var net = require('net');
var specification = require('../lib/specification');
var ConnectionHandle = require('../lib/connectionHandle');

var puts = require('vows').console.puts({
	stream : process.stdout
});

var HANDLES = [];

function connectAMQP(i, callback) {
	var socket = net.connect({host: 'localhost', port: 5672});
	socket.once('connect', function() {
		var spec = 'rabbitmq/full/amqp0-9-1.stripped.extended';
		var handle = new ConnectionHandle(socket, spec);
		handle.once('init', function() {
			handle.openAMQPCommunication('guest', 'guest', true, 
				function() {
					HANDLES.push(handle);
					callback();
				});
		});
	});
};

function disconnectAMQP(i, callback) {
	var handle = HANDLES[i];
	handle.closeAMQPCommunication(function() {
		handle.socket.end();
	});
}

function connectAllSeries(callback) {
	async.eachSeries([0,1,2,3,4], function(i, seriesCallback) {
		connectAMQP(i, seriesCallback);
	}, function(err) {
		callback();
	});
}

var exchangeDeclare = function(i) {
	return function() {
		var self = this;
		var handle = HANDLES[i];

		var bail = setTimeout(function() {
			self.callback(false, i);
		}, 2500);

		var ex = 'TestEX-' + i.toString();
		handle.exchange.declare(1, ex, 'direct', false, false, false, false, false, {}, function() {
			handle.once('exchange.declare-ok', function() {
				clearTimeout(bail);
				self.callback(true, i);
			});
		});
	}
}

var queueDeclare = function(i) {
	return function() {
		var self = this;
		var handle = HANDLES[i];

		var bail = setTimeout(function() {
			self.callback(false, i);
		}, 2500);

		var q = 'TestQ-' + i.toString();
		handle.queue.declare(1, q, false, function() {
			handle.once('queue.declare-ok', function() {
				clearTimeout(bail);
				self.callback(true, i);
			});
		});
	}
}

var verifyDeclare = function() {
	return function(success, i, error) {
		disconnectAMQP(i);
		assert.strictEqual(success, true);
	}
}

vows.describe('concurrent exchange declare').addBatch({
	'get connected...' : {
		topic : function() {
			HANDLES = [];
			connectAllSeries(this.callback);
		},
		'assume connected' : function() {
			assert.equal(5, HANDLES.length);
		},
		'exchange declare 0' : {
			topic: exchangeDeclare(0),
			'check exchange declared': verifyDeclare()
		},
		'exchange declare 1' : {
			topic: exchangeDeclare(1),
			'check exchange declared': verifyDeclare()
		},
		'exchange declare 2' : {
			topic: exchangeDeclare(2),
			'check exchange declared': verifyDeclare()
		},
		'exchange declare 3' : {
			topic: exchangeDeclare(3),
			'check exchange declared': verifyDeclare()
		},
		'exchange declare 4' : {
			topic: exchangeDeclare(4),
			'check exchange declared': verifyDeclare()
		}
	}
}).addBatch({
	'get connected...' : {
		topic : function() {
			HANDLES = [];
			connectAllSeries(this.callback);
		},
		'assume connected' : function() {
			assert.equal(5, HANDLES.length);
		},
		'queue declare 0' : {
			topic: queueDeclare(0),
			'check queue declared': verifyDeclare()
		},
		'queue declare 1' : {
			topic: queueDeclare(1),
			'check queue declared': verifyDeclare()
		},
		'queue declare 2' : {
			topic: queueDeclare(2),
			'check queue declared': verifyDeclare()
		},
		'queue declare 3' : {
			topic: queueDeclare(3),
			'check queue declared': verifyDeclare()
		},
		'queue declare 4' : {
			topic: queueDeclare(4),
			'check queue declared': verifyDeclare()
		}
	}
	
}).export(module);

