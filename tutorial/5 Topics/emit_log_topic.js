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
	await send.exchange.declare('topic_logs', 'topic');
	const args = process.argv.splice(2);
	const severity = args.length ? args.shift() : 'info';
	const message = args.length ? args.join(' ') : 'Hello World!';
	await send.basic.publish('topic_logs', severity, false, false, {}, message);
	await handle.closeAMQPCommunication();
	handle.socket.destroy();
}
main();
