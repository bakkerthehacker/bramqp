# Setup

Before using bramqp, the module must be required, the specification loaded, and a socket initialized.

## Require

Requiring allows your node application to use bramqp, but you already knew that.

`var bramqp = require('bramqp');`

## Specification

To support multiple protocols, bramqp needs to load an xml specification.
For adding new specifications, see [Specification](Specification.md).

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

Although there are several specifications included in bramqp, only `amqp0-9-1.stripped.extended` is fully supported. 
All parsers, tutorials and tests are built using this specification.  The `amqp0-9-1.stripped` specification may work as well. 
However, the others are quite different and will probably not work at all. 

## Socket

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
