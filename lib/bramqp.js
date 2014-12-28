'use strict';

var path = require('path');
var fs = require('fs');
var ConnectionHandle = require('./connectionHandle');

exports.initialize = function(socket, spec, callback) {
	socket.once('connect', function() {
		var handle = new ConnectionHandle(socket, spec);
		handle.once('init', function() {
			callback(null, handle);
		});
	});
};

exports.version = require(path.join(__dirname, '..', 'package')).version;

