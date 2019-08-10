'use strict';
const pkginfo = require('pkginfo');
const ConnectionHandle = require('./connectionHandle');
pkginfo(module);
exports.initialize = function(socket, spec, callback) {
	const connect = function() {
		const handle = new ConnectionHandle(socket, spec);
		handle.once('init', function() {
			callback(null, handle);
		});
	};
	if (socket.readyState === 'open') {
		connect();
	} else {
		socket.once('connect', connect);
	}
};
