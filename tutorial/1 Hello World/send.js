'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
async function send() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	const { client, server } = handle.channel(1);
	await client.queue.declare('hello');
	await client.basic.publish('', 'hello', false, false, {}, 'Hello World!');
	await handle.closeAMQPCommunication();
	handle.socket.end();
}
send();
