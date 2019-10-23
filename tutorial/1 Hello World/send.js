'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
async function main() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	const { send } = handle.channel(1);
	await send.queue.declare('hello');
	console.log('queue declared');
	await send.basic.publish('', 'hello', false, false, {}, 'Hello World!');
	console.log('published');
	await handle.closeAMQPCommunication();
	handle.socket.destroy();
}
main();
