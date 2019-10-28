'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
async function main() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	let channel = handle.channel(1);
	await channel.openAMQPChannel();
	await channel.queue.declare('hello');
	console.log('queue declared');
	let { data } = await channel.basic.consume('hello', '', false, true, false, false, {});
	console.log('consuming from queue');
	console.log(data['consumer-tag']);
	channel.basic.deliver.on('data', ({ body }) => {
		console.log(`got a message: ${body}`);
	});
}
main();
