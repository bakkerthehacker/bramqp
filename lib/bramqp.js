var specification = require('./specification');

var ConnectionHandle = require('./connectionHandle');

exports.initialize = function(socket, spec, callback) {
	socket.on('error', callback);
	socket.on('connect', function() {
		var handle = new ConnectionHandle(socket, spec);
		handle.once('init', function() {
			callback(null, handle);
		});
	});
};
