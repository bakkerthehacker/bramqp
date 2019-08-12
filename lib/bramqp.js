'use strict';
const { once } = require('events');
const pkginfo = require('pkginfo');
const ConnectionHandle = require('./connectionHandle');
pkginfo(module);
exports.initialize = async(socket, spec, ...rest) => {
	if (rest.length) {
		// TODO old api
		throw Error('bramqp has been updated to use promises and async functions instead of callbacks');
	}
	if (socket.readyState !== 'open') {
		await once(socket, 'connect');
	}
	const handle = new ConnectionHandle();
	await handle.init(socket, spec);
	return handle;
};
