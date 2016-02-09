'use strict';

var pkginfo = require('pkginfo');
var ConnectionHandle = require('./connectionHandle');

pkginfo(module);

exports.initialize = function(socket, spec, callback) {
	if (socket.readyState === 'open'){
		var handle = new ConnectionHandle(socket, spec);
		handle.once('init', function () {
			callback(null, handle);
		});
	}
	else {
		socket.once('connect', function () {
			var handle = new ConnectionHandle(socket, spec);
			handle.once('init', function () {
				callback(null, handle);
			});
		});

		// Node 0.10.x tls fix
		// tls only became a socket in 0.11.x
		socket.once('secureConnect', function () {
			socket.emit('connect');
		});
	}
};
