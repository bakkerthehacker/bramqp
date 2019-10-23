'use strict';
const util = require('util');
const { EventEmitter, once } = require('events');
const Transmitter = require('./transmitter');
const Receiver = require('./receiver');
const FrameParser = require('../frame/parser');
const FrameSerializer = require('../frame/serializer');
class BaseHandle {
	constructor(socket, spec, chassis) {
		this.socket = socket;
		this.write = util.promisify(this.socket.write).bind(this.socket);
		this.spec = spec;
		this.chassis = chassis;
		this.client = (this.chassis === 'client');
		this.server = (this.chassis === 'server');
		this.channelNumber = 0;
	}
	async init() {
		this.frameParser = new FrameParser(this.spec);
		this.frameSerializer = new FrameSerializer(this.spec);
		this.socket.on('data', (data) => {
			console.log(`data size ${data.length}`);
			this.frameParser.parse(data);
		});
		await this.write('AMQP' + String.fromCharCode(0, this.spec.amqp.major, this.spec.amqp.minor, this.spec.amqp.revision));
	}
	get send() {
		return new Transmitter(this);
	}
	get receive() {
		return new Receiver(this);
	}
}
class Channel extends BaseHandle {
	constructor(parent, channel) {
		super(parent.socket, parent.spec, parent.chassis);
		this.frameParser = parent.frameParser;
		this.frameSerializer = parent.frameSerializer;
		this.channelNumber = channel;
	}
}
class ConnectionHandle extends BaseHandle {
	channel(number) {
		if (!this.channel[number]) {
			this.channel[number] = new Channel(this, number);
		}
		return this.channel[number];
	}
	clientProperties(serverPropertiesData) {
		const clientCapabilities = {};
		const serverCapabilities = serverPropertiesData['server-properties']['capabilities'];
		for (let capability in serverCapabilities) {
			if (serverCapabilities[capability]) {
				clientCapabilities[capability] = {
					type: 'Boolean',
					data: true
				};
			}
		}
		const clientProperties = {
			product: {
				type: 'Long string',
				data: 'bramqp'
			},
			version: {
				type: 'Long string',
				data: require('../bramqp').version
			},
			platform: {
				type: 'Long string',
				data: 'Node.js'
			},
			capabilities: {
				type: 'Nested Table',
				data: clientCapabilities
			},
			information: {
				type: 'Long string',
				data: 'See https://github.com/bakkerthehacker/bramqp'
			},
		};
		return clientProperties;
	}
	async openAMQPCommunication(username = 'guest', password = 'guest', heartbeat = true, vhost = '/') {
		const { send, receive } = this;
		let [{ fieldData, respond }] = await once(receive.connection, 'start');
		await respond['start-ok'](this.clientProperties(fieldData), 'AMQPLAIN', {
			LOGIN: {
				type: 'Long string',
				data: username
			},
			PASSWORD: {
				type: 'Long string',
				data: password
			}
		}, 'en_US');
		[{ fieldData, respond }] = await once(receive.connection, 'tune');
		let channelMax = fieldData['channel-max'];
		if (channelMax === 0) {
			channelMax = (1 << 16) - 1;
		}
		this.frameSerializer.frameMax = fieldData['frame-max'];
		if (heartbeat) {
			if (heartbeat === true) {
				heartbeat = fieldData.heartbeat;
			}
		} else {
			heartbeat = 0;
		}
		await respond['tune-ok'](channelMax, fieldData['frame-max'], heartbeat);
		if (heartbeat && fieldData.heartbeat) {
			this.heartbeatsMissed = 0;
			this.heartbeatIntervalId = setInterval(async() => {
				await this.send.heartbeat();
				if (this.heartbeatsMissed >= 2) {
					throw new Error('oh no! server is not sending heartbeats!');
				}
				this.heartbeatsMissed++;
			}, heartbeat * 1000);
			this.receive.on('heartbeat', () => {
				this.heartbeatsMissed = 0;
			});
			this.socket.once('close', () => {
				clearInterval(this.heartbeatIntervalId);
			});
		}
		await send.connection.open(vhost);
		await this.channel(1).send.channel.open();
		this.channel(1).receive.channel.on('close', async({ respond }) => {
			await respond['close-ok']();
			await this.channel(1).send.channel.open();
		});
		this.channel(1).receive.channel.on('flow', async({ respond, fieldData }) => {
			await respond(fieldData.active);
			if (fieldData.active) {
				this.socket.resume();
			} else {
				this.socket.pause();
			}
		});
	}
	async closeAMQPCommunication() {
		await this.channel(1).send.channel.close(200, 'Closing channel');
		await this.send.connection.close(200, 'Closing connection');
		clearInterval(this.heartbeatIntervalId);
	}
}
module.exports = ConnectionHandle;
