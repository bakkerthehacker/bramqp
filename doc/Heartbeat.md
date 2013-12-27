# Heartbeat

Heartbeats are special signals that ensure that the AMQP server and client can still communicate.
The methods `connection.tune` and `connection.tune-ok` determine if and how often heartbeats should be sent.

If two heartbeats are sent without receiving a heartbeat from the server, then the server is considered unreachable.

Heartbeats can be sent by calling `heartbeat`.

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
