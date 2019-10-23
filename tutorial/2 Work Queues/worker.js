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
	await send.basic.qos(0, 1, false);
	await send.queue.declare('task_queue', false, true, false, false, false, {});
	console.log('queue declared');
	let { fieldData } = await send.basic.consume('task_queue', '', false, false, false, false, {});
	console.log('consuming from queue');
	console.log(fieldData['consumer-tag']);
	receive.basic.on('deliver', data => {
		console.log(data);
		console.log('got a message:');
		console.log(data.body.toString());
		console.log('with properties:');
		console.log(data.header);
		setTimeout(() => {
			console.log('acking');
			send.basic.ack(data.fieldData['delivery-tag']);
		}, data.body.length * 1000);
	});
}
main();
