'use strict';
const { once } = require('events');
const pkginfo = require('pkginfo');
const ConnectionHandle = require('./connection/handle');
const { fetchSpecification } = require('./spec/fetch');
pkginfo(module);
exports.initialize = async(socket, spec, chassis = 'client') => {
	if (socket.readyState !== 'open') {
		await once(socket, 'connect');
	}
	const specData = await fetchSpecification(spec);
	const handle = new ConnectionHandle(socket, specData, chassis);
	await handle.init();
	return handle;
};
