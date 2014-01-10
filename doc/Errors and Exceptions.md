# Errors

Errors can occur in a variety of different scenarios, and need to be handled accordingly.

- First an error can occur when selecting the specification or initializing the socket. If an error occurs the callback is called with the error passed back as the first argument. An example of this would be the filepath to the specification is invalid.

- Next errors can occur during operation. With operation defined as the specification already having been selected and the socket initialized. These errors cover cases such as the server dropping the connection and no longer sending heartbeats. These errors are handled by an error event emitted from the 'handle'

- Finally errors can occur when methods are called. These errors are also passed back as the first argument to the callback for the given method.

Handling Errors in setting up of the connection
```javascript
bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
    if (error) {
        return console.log(util.inspect(error));
    }
    var socket = net.connect({
    port : 5672,
    }, function() {
        bramqp.initializeSocket(socket, function(error, handle) {
            handle.on('error', function(error){
                console.log("caught handle error");
                throw(error);
            });
    });
});
```

# Exceptions

Exceptions are different from errors. An exception is not a problem with any files or sockets. Instead, the AMQP server may raise an exception as a result of incorrect or illegal data in the messages sent or as a result of an error in the operation of the AMQP server. This may include attempting to access a queue or exchange that does not exists, sending content when it is not expected, or any other exception defined in the specification. 

Exceptions are sent by closing either the channel or connection where the issue occurred. The `openAMQPCommunication` function will re-open a closed channel but will not re-open a closed connection. For more details, see the documentation for [connection.close](https://www.rabbitmq.com/amqp-0-9-1-reference.html#connection.close) and [channel.close](https://www.rabbitmq.com/amqp-0-9-1-reference.html#channel.close).
