'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
async function main() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	const { send, receive } = handle.channel(1);
	await send.queue.declare('hello');
	console.log('queue declared');
	let { fieldData } = await send.basic.consume('hello', '', false, true, false, false, {});
	console.log('consuming from queue');
	console.log(fieldData['consumer-tag']);
	receive.basic.on('deliver', data => {
		console.log(`got a message: ${data.body}`);
	});
}
main();
