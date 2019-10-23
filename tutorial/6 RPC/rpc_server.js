'use strict';
const bramqp = require('../../lib/bramqp');
const net = require('net');
const fib = (n) => {
	if (n === 0) {
		return 0;
	} else if (n === 1) {
		return 1;
	} else {
		return fib(n - 1) + fib(n - 2);
	}
};
async function main() {
	const socket = net.connect({
		port: 5672
	});
	let handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	let { send, receive } = handle.channel(1);
	await send.queue.declare('rpc_queue');
	console.log('queue declared');
	await send.basic.qos(0, 1, false);
	console.log('qos updated');
	let { fieldData } = await send.basic.consume('rpc_queue', '', false, false, false, false, {});
	console.log('consuming from queue');
	console.log(fieldData);
	receive.basic.on('deliver', async({ fieldData, body, header }) => {
		console.log('got a message:');
		console.log(fieldData);
		const n = parseInt(body.toString(), 10);
		console.log(' [.] fib(' + n + ')');
		const response = fib(n);
		await send.basic.publish('', header['reply-to'], false, false, { 'correlation-id': header['correlation-id'] }, response.toString());
		await send.basic.ack(fieldData['delivery-tag']);
	});
}
main();
