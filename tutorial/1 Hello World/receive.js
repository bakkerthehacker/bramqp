'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
async function receive() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	const { client, server } = handle.channel(1);
	await client.queue.declare('hello');
	await client.basic.consume('hello', '', false, true, false, false, {});
	for await (let { content }
		of server.basic.deliver()) {
		console.log(`got a message: ${content}`);
	}
}
receive();
