# Other Handle Functions

The `handle` provides additional functions which perform common but complicated tasks.

#### handle.openAMQPCommunication(username, password, heartbeat, vhost, callback(error))

- `username` The username used to log into AMQPLAIN. Defaults to `'guest'`.
- `password` The password used to log into AMQPLAIN. Defaults to `'guest'`.
- `heartbeat` A boolean which controls if heartbeats are enabled.  If set to true, heartbeats are sent at the time suggested by the server. Defaults to `true`.
- `vhost` The vhost used to open the connection. Defaults to `'/'`.
- `callback(error)` Called once the content has been written to the socket.

`openAMQPCommunication` performs the following tasks:

- open the amqp connection using AMQPLAIN
- tune the connection and optionally enable heartbeats
- open the vhost provided
- open channel 1
- channel 1 will re-open if closed by the server
- the socket will be paused and resumed as requested by channel 1

#### handle.closeAMQPCommunication(callback(error))
  
- `callback(error)` Called once the content has been written to the socket.

`closeAMQPCommunication` performs the following tasks:

- close channel 1
- close the amqp connection
- stop the heartbeats

#### handle.setFrameMax(frameMax)
  
- `frameMax` The new largest frame that should be used;

`setFrameMax` updates the size of the buffers used for AMQP communication.  Should be called after receiving `connection.tune` method.
