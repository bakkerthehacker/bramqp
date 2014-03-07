var vows = require('vows');
var assert = require('assert');
var net = require('net');
var async = require('async');

var bramqp = require('../lib/bramqp');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows
		.describe('queue')
		.addBatch(
				{
					'A queue' : {
						topic : function(callback){
							var self = this;
							bramqp.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error) {
								if(error){
									return self.callback(error);
								}
								var socket = net.connect({
									port : 5672
								});
								socket.on('error', self.callback);
								socket.on('connect', function() {
									bramqp.initializeSocket(socket, function(error, handle) {
										if(error){
											return self.callback(error);
										}
										async.series([ function(seriesCallback) {
											handle.openAMQPCommunication(seriesCallback);
										}, function(seriesCallback) {
											handle.queue.declare(1, 'test-queue', function(error){
												if(error){
													return seriesCallback(error);
												}
												handle.once('queue.declare-ok', function(channel, method, data) {
													seriesCallback();
												});
											});
										} ], function(error) {
											self.callback(error, handle);
										});
									});
								});
							});
						},
						'should recieve messages sent to it' : function(handle){
							assert(handle);
						}
					}
				}).export(module);
