'use strict';

var fs = require('fs');
var ConnectionHandle = require('./connectionHandle');

var VERSION;
if (VERSION === undefined) {
	var o = JSON.parse(fs.readFileSync(path.join(__dirname, '/../package.json')));
	VERSION = o.version;
}

exports.initialize = function(socket, spec, callback) {
	socket.once('connect', function() {
		var handle = new ConnectionHandle(socket, spec);
		handle.once('init', function() {
			callback(null, handle);
		});
	});
};

exports.version = VERSION;

