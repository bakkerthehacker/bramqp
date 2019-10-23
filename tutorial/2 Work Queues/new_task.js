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
	await send.queue.declare('task_queue', false, true, false, false, false, {});
	console.log('queue declared');
	const args = process.argv.splice(2);
	const message = args.length ? args.join(' ') : 'Hello World!';
	await send.basic.publish('', 'task_queue', false, false, { delivery_mode: 2 }, message);
	await handle.closeAMQPCommunication();
	handle.socket.destroy();
}
main();
