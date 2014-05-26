# Content

When sending a message, the message body is sent separately as content. It is sent to a class,
but only the `basic` class supports content. Content is sent after a method that uses it, such as
`basic.publish`.

To send content to the server, simply call `content`.

#### handle.content(channel, className, properties, content, callback(error))

- `channel` The channel to send the content on.
- `className` The name of the class to send the content to.
- `properties` An object containing properties relating to the content. See [Value Types](Value Types.md).
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
