'use strict';
const bramqp = require('../../lib/bramqp');
const { once } = require('events');
const net = require('net');
class FibonacciRpcClient {
	async init() {
		const socket = net.connect({
			port: 5672
		});
		this.handle = await bramqp.initialize(socket, 'rabbitmq/amqp0-9-1.stripped.extended');
		await this.handle.openAMQPCommunication('guest', 'guest', true);
		let { send, receive } = this.handle.channel(1);
		let { fieldData } = await send.queue.declare('', false, false, true, false, false, {});
		console.log('queue declared');
		this.callbackQueue = fieldData.queue;
		await send.basic.consume(this.callbackQueue, '', false, true, false, false, {});
		console.log('consuming from queue');
	}
	async call(n) {
		this.response = null;
		this.corrId = Math.random().toString();
		await this.handle.channel(1).send.basic.publish('', 'rpc_queue', false, false, {
			'reply-to': this.callbackQueue,
			'correlation-id': this.corrId
		}, n.toString());
		while (this.response === null) {
			let [{ body, header }] = await once(this.handle.channel(1).receive.basic, 'deliver');
			console.log('got a message:');
			if (this.corrId === header['correlation-id']) {
				this.response = body.toString();
				await this.handle.closeAMQPCommunication();
				this.handle.socket.destroy();
				return this.response;
			}
		}
	}
}
async function main() {
	const fibonacciRpc = new FibonacciRpcClient();
	await fibonacciRpc.init();
	console.log(' [x] Requesting fib(30)');
	console.log(' [.] Got ' + await fibonacciRpc.call(30));
}
main();
