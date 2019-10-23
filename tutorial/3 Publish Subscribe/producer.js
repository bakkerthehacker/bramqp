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
	send.basic.publish('logs', 'logKey', true, false, {}, 'basic');
	console.log('message published');
	receive.basic.on('return', function({ fieldData }) {
		console.log('Message Returned from Server');
		console.log(fieldData['reply-code']);
		console.log(fieldData['reply-text']);
		console.log(fieldData['exchange']);
	});
	setTimeout(async() => {
		await handle.closeAMQPCommunication();
		handle.socket.destroy();
	}, 10 * 1000);
}
main();
