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
	await send.exchange.declare('direct_logs', 'direct');
	console.log('exchange declared');
	let { fieldData } = await send.queue.declare('', false, false, true, false, false, {});
	console.log('queue declared');
	console.log(fieldData);
	const tempQueueName = fieldData.queue;
	const args = process.argv.splice(2);
	if (!args.length) {
		console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' [info] [warning] [error]');
		process.exit(1);
	}
	for (let severity of args) {
		await send.queue.bind(tempQueueName, 'direct_logs', severity, false, {});
		console.log('queue ' + tempQueueName + ' bound to direct_logs');
	}
	({ fieldData } = await send.basic.consume(tempQueueName, '', false, true, false, false, {}));
	console.log('consuming from queue');
	console.log(fieldData['consumer-tag']);
	receive.basic.on('deliver', data => {
		console.log(`got a message: ${data.body}`);
	});
}
main();
