'use strict';
const { once } = require('events');
const bramqp = require('../../lib/bramqp');
const net = require('net');
const MESSAGE_COUNT = 50000;
async function publishMessagesIndividually(handle) {
	const { send, receive } = handle;
	let queue = 'test1';
	await send.queue.declare(queue, false, false, false, true, false, null);
	await send.confirm.select();
	let start = Date.now();
	for (let i = 0; i < MESSAGE_COUNT; i++) {
		await send.basic.publish('', queue, false, false, {}, i.toString());
		let [ack] = await Promise.race([
			once(receive.basic, 'ack'),
			once(receive.basic, 'nack'),
		]);
		if (ack.method.name === 'nack') {
			throw new Error('Message rejected by server' + ack.fieldData['delivery-tag']);
		}
	}
	let end = Date.now();
	console.log(`Published ${MESSAGE_COUNT} messages individually in ${end - start} ms`);
}
async function publishMessagesInBatch(handle) {
	const { send, receive } = handle;
	let queue = 'test2';
	await send.queue.declare(queue, false, false, false, true, false, null);
	await send.confirm.select();
	let batchSize = 100;
	let outstandingMessageCount = 0;
	let start = Date.now();
	for (let i = 0; i < MESSAGE_COUNT; i++) {
		await send.basic.publish('', queue, false, false, {}, i.toString());
		outstandingMessageCount++;
		if (outstandingMessageCount === batchSize) {
			let [ack] = await Promise.race([
				once(receive.basic, 'ack'),
				once(receive.basic, 'nack'),
			]);
			if (ack.method.name === 'nack') {
				console.log(ack);
				throw new Error('Messages rejected by server');
			}
			outstandingMessageCount = 0;
		}
	}
	if (outstandingMessageCount > 0) {
		let [ack] = await Promise.race([
			once(receive.basic, 'ack'),
			once(receive.basic, 'nack'),
		]);
		if (ack.method.name === 'nack') {
			console.log(ack);
			throw new Error('Messages rejected by server');
		}
	}
	let end = Date.now();
	console.log(`Published ${MESSAGE_COUNT} messages in batch in ${end - start} ms`);
}
async function handlePublishConfirmsAsynchronously(handle) {
	const { send, receive } = handle;
	let queue = 'test3';
	await send.queue.declare(queue, false, false, false, true, false, null);
	await send.confirm.select();
	let outstandingConfirms = new Map();
	let handleAck = function({ fieldData }) {
		// console.log('ack')
		// console.log(fieldData);
		// console.log(outstandingConfirms.size);
		if (fieldData.multiple) {
			if (fieldData['delivery-tag'] === 0) {
				outstandingConfirms.clear();
			} else {
				for (let key of outstandingConfirms.keys()) {
					if (key > fieldData['delivery-tag']) {
						break;
					}
					outstandingConfirms.delete(key);
				}
			}
		} else {
			outstandingConfirms.delete(fieldData['delivery-tag']);
		}
	};
	receive.basic.on('ack', handleAck);
	let handleNack = function({ fieldData }) {
		console.log('nack');
		let body = outstandingConfirms.get(fieldData['delivery-tag']);
		console.log(`Message with body ${body} has been nack-ed. Sequence number: ${fieldData['delivery-tag']}, multiple: ${fieldData.multiple}`, );
		handleAck(...arguments);
	};
	receive.basic.on('nack', handleNack);
	let sequenceNumber = 1;
	let start = Date.now();
	for (let i = 0; i < MESSAGE_COUNT; i++) {
		let body = i.toString();
		outstandingConfirms.set(sequenceNumber++, body);
		await send.basic.publish('', queue, false, false, {}, body);
	}
	while (outstandingConfirms.size > 0) {
		await Promise.race([
			once(receive.basic, 'ack'),
			once(receive.basic, 'nack'),
		]);
	}
	let end = Date.now();
	console.log(`Published ${MESSAGE_COUNT} messages and handled confirms asynchronously in ${end - start} ms`);
}
async function main() {
	const socket = net.connect({
		port: 5672
	});
	const handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
	await handle.openAMQPCommunication('guest', 'guest', true);
	// await publishMessagesIndividually(handle.channel(1));
	// await publishMessagesInBatch(handle.channel(1));
	await handlePublishConfirmsAsynchronously(handle.channel(1));
	await handle.closeAMQPCommunication();
	handle.socket.destroy();
}
main();
