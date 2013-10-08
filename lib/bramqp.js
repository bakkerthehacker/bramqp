var specification = require('./specification');

var ConnectionHandle = require('./connectionHandle');

exports.selectSpecification = function(path, callback) {
	specification.selectSpecification(path, callback);
};

exports.initializeSocket = function(socket, callback) {
	var handle = new ConnectionHandle(socket);
	handle.initializeSpec(function(error) {
		callback(error, handle);
	});
};
