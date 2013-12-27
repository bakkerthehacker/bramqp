# Method

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

Sending and receiving methods can also use a more general interface.
The previous specific interface simply calls this general interface and both function identically.
This interface is provided for convenience and should only be used in special circumstances, such as logging all incoming methods.

#### handle.method(channel, className, methodName, data, [callback(error)])

- `channel` The AMQP channel to send the method on.
The channel MUST be `0` when the class is `connection` and MUST NOT be `0` otherwise.
- `className` The name of the class that the method belongs to.
- `methodName` The name of the method being called.
- `data` An object containing the arguments as specified by the AMQP method. 
- `callback(error)` Called once the method has been written to the socket.

#### Event: 'method'

- `channel` The channel the method was received on.
- `className` The name of the class that the method belongs to.
- `method` An object containing information about the method called. This is essentially a javascript version of the method as it appears in the xml specification.
- `data` An object containing the argument values.

Example:

```javascript
handle.method(1, 'exchange', 'declare', {'exchange-name' : 'exchange-name', 'type' : 'topic'}, function(methodError){
	if (methodError) {
		console.log(methodError);
	}
	console.log('declare method sent');
});

handle.on('method', function(channel, className, method, data) {
	console.log('incoming method: ' + className + '.' + method.name);
});
```
