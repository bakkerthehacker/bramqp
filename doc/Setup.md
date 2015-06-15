# Setup

Before using bramqp, the module must be required and a socket initialized.

## Require

Requiring allows your node application to use bramqp, but you already knew that.

`var bramqp = require('bramqp');`

## Initialize Socket

A network socket must be supplied to bramqp. Supplying an existing connection allows bramqp to be as flexible as possible,
while also not having to worry about security and certificates for AMQPS connections.
In fact, the socket only needs to implement [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex_1).

#### bramqp.initialize(socket, specification, [callback(error, handle)])

- `socket` A connection that implements stream.Duplex.
- `specification` The path to the xml specification that will be used.
- `callback(error, handle)` Called once the initialization data has been written to the socket.
The `handle` in the callback is used for all further communication involving this specific socket.

Example:

```javascript
var net = require('net');

var socket = net.connect({
	port : 5672
});
bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(initError, handle) {
	if (initError) {
		console.log(initError);
	}
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
});
bramqp.initialize(socket, 'rabbitmq/full/amqp0-9-1.stripped.extended', function(initError, handle) {
	if (initError) {
		console.log(initError);
	}
});
```

The following specifications are included in bramqp:

RabbitMQ

- `rabbitmq/full/amqp0-9-1.stripped.extended`
- `rabbitmq/full/amqp0-9-1.stripped`
- `rabbitmq/full/amqp0-9.stripped`
- `rabbitmq/full/amqp0-8.stripped`

Qpid

- `qpid/specs/amqp.0-10-qpid-errata.stripped`
- `qpid/specs/amqp.0-10.stripped`
- `qpid/specs/amqp0-8-qpid.stripped`
- `qpid/specs/amqp0-8.stripped`
- `qpid/specs/amqp0-9-1.stripped`
- `qpid/specs/amqp0-9-qpid.stripped`
- `qpid/specs/amqp0-9.stripped`
- `qpid/specs/amqp-dtx-preview.0-9`
- `qpid/specs/amqp-errata.0-9`
- `qpid/specs/amqp-nogen.0-9`
- `qpid/specs/apache-filters`
- `qpid/specs/cluster.0-8`

Although there are several specifications included in bramqp, only `rabbitmq/full/amqp0-9-1.stripped.extended` is fully supported.
All parsers, tutorials and tests are built using this specification.  The `rabbitmq/full/amqp0-9-1.stripped`  and `qpid/specs/amqp0-9-1.stripped` specifications may work as well.
However, the others may be quite different and will probably not work at all.

For adding new specifications, see [Specification](Specification.md).
