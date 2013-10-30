# bakkerthehacker's radical AMQP library

A rad, raw, robust, remarkable AMQP library for node.js

## Benefits over existing AMQP libraries

- Dynamically loaded specification from xml
- 100% specification implementation including all extensions
- Provides direct access to all AMQP methods
- Support for any duplex stream including TLS/SSL

## Drawbacks over existing AMQP libraries

- The application code is more verbose
- A thorough knowledge of the AMQP specification is needed

## Installation

```
npm install bramqp
```

or

```
npm install git+https://github.com/bakkerthehacker/bramqp.git#implement
```

## Usage

Before using bramqp, the module must be required, the specification loaded, and a socket initialized.

### Require

Requiring allows your node application to use bramqp, but you already knew that.

`var bramqp = require('bramqp');`

### Specification

To support multiple protocols, bramqp needs to load an xml specification.
For adding new specifications, see [Adding specifications](#adding-specifications).

#### bramqp.selectSpecification(specification, [callback(error)])

- `specification` The path to the xml specification that will be used.
- `callback(error)` Called once the specification has been loaded and selected.

Example:

```javascript
bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(selectError){
	if(selectError){
		console.log(selectError);
	}
});
```

The following specifications are included in bramqp:

- `rabbitmq/full/amqp0-9-1.stripped.extended`
- `rabbitmq/full/amqp0-9-1.stripped`
- `rabbitmq/full/amqp0-9.stripped`
- `rabbitmq/full/amqp0-8.stripped`

### Socket

A network socket must be supplied to bramqp. Supplying an existing connection allows bramqp to be as flexible as possible,
while also not having to worry about security and certificates for AMQPS connections.
In fact, the socket only needs to implement [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex_1).

#### bramqp.initializeSocket(socket, [callback(error, handle)])

- `socket` A connection that implements stream.Duplex.
- `callback(error, handle)` Called once the initialization data has been written to the socket.
The `handle` in the callback is used for all further communication involving this specific socket.

Example:

```javascript
var net = require('net');

var socket = net.connect({
	port : 5672
}, function() {
	bramqp.initializeSocket(socket, function(initError, handle) {
		if (initError) {
			console.log(initError);
		}
	});
});
```

Example using TLS:

```javascript
var tls = require('tls');
var fs = require('fs');

var socket = tls.connect({
	port : 5671,
	key : fs.readFileSync('client-key.pem'),
	cert : fs.readFileSync('client-cert.pem'),
	ca : [ fs.readFileSync('server-cert.pem') ]
}, function() {
	bramqp.initializeSocket(socket, function(initError, handle) {
		if (initError) {
			console.log(initError);
		}
	});
});
```

### Method

All AMQP commands, both to and from the server, are sent as methods. These methods belong to a class.
[RabbitMQ](https://www.rabbitmq.com) has very good [documentation](https://www.rabbitmq.com/amqp-0-9-1-reference.html)
for all of these methods. This documentations is specific to the 0-9-1 extended specification, but is very similar to the other specifications.

When sending methods to the server, simply call the method.

#### handle.\<class\>.\<method\>([channel], [arguments...], [callback(error)])

- `channel` The AMQP channel to send the method on.
The channel MUST NOT be included when the class is `connection` and MUST be included otherwise.
- `arguments` The arguments as specified by the AMQP method.
- `callback(error)` Called once the method has been written to the socket.

Some methods contain a hyphen, `-`. These methods must be called using bracket notation.

#### handle.\<class\>\[\<method-with-hyphen\>\](...)

When a message is received from the server, the `handle` emits an event.

#### Event: '\<class\>.\<method\>'

- `channel` The channel the method was received on.
- `method` An object containing information about the method called. This is essentially a javascript version of the method as it appears in the xml specification.
- `data` An object containing the argument values.

Example:

```javascript
handle.exchange.declare(1, 'exchange-name', 'topic', false, true, false, false, false, {}, function(methodError){
	if (methodError) {
		console.log(methodError);
	}
	console.log('declare method sent');
});

handle.on('exchange.declare-ok', function(channel, method, data) {
	console.log('exchange declared');
});
```

### Content

When sending a message, the message body is sent separately as content. It is sent to a class,
but only the `basic` class supports content. Content is sent after a method that uses it, such as
`basic.publish`.

To send content to the server, simple call `content`.

#### handle.content(channel, className, properties, content, callback(error))

- `channel` The channel to send the content on.
- `className` The name of the class to send the content to.
- `properties` An object containing properties relating to the content.
- `content`	A string or buffer containing the message body.
- `callback(error)` Called once the content has been written to the socket.

When content is received from the server, the `handle` emits an event.

#### Event: 'content'

- `channel` The channel the content was received on.
- `className` The name of the class that the content was sent to.
- `properties` An object containing properties relating to the content.
- `content` A buffer containing the message body.

Example:

```javascript
var message = JSON.stringify({
	key : 'value'
});
handle.basic.publish(1, 'exchange-name', 'routing-key', true, false, function(publishError) {
	if(publishError){
		console.log(publishError);
	}
	handle.content(1, 'basic', {
		'content-type' : 'application/json'
	}, message, function(contentError){
		if(contentError){
			console.log(contentError);
		}
	});
});
```

```javascript
handle.on('basic.deliver', function(channel, method, data) {
	console.log('incoming message');
	console.log(data);
	handle.once('content', function(channel, className, properties, content) {
		console.log('got a message:');
		console.log(content.toString());
		console.log('with properties:');
		console.log(properties);
		handle.basic.ack(1, data['delivery-tag'], function(ackError){
			if(ackError){
				console.log(ackError);
			}
		});
	});
});
```

### Heartbeat

Heartbeats are special signals that ensure that the AMQP server and client can still communicate.
The methods `connection.tune` and `connection.tune-ok` determine if and how often heartbeats should be sent.

If two heartbeats are sent without receiving a heartbeat from the server, then the server is considered unreachable.

Heartbeats can be send by calling `heartbeat`.

#### handle.heartbeat(callback(error))

- `callback(error)` Called once the heartbeat has been written to the socket.

When heartbeats are received from the server, the handle emits an event.

#### Event: 'heartbeat'

Example:

```javascript
var heartbeatsMissed = 0;

setInterval(function() {
	handle.heartbeat(function(heartbeatError) {
		if (heartbeatError) {
			console.log(heartbeatError);
		}
		console.log('sending heartbeat');
	});
	if (heartbeatsMissed >= 2) {
		console.log('oh no! server is not sending heartbeats!');
	}
	heartbeatsMissed++;
}, data.heartbeat * 1000);

handle.on('heartbeat', function() {
	heartbeatsMissed = 0;
});
```
