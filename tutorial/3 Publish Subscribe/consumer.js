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
	await send.exchange.declare('logs', 'fanout', false, false, true, false, false, {});
	console.log('exchange declared');
	let { fieldData } = await send.queue.declare('', false, false, false, true, false, {});
	console.log('queue declared');
	let queueName = fieldData.queue;
	console.log(queueName);
	await send.queue.bind(queueName, 'logs', '', false, {});
	console.log('queue bound sucessfully');
	await send.basic.consume(queueName, '', false, true, true, false, {});
	console.log('consuming from queue');
	receive.basic.on('deliver', data => {
		console.log(`got a message: ${data.body}`);
	});
}
main();
