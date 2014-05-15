var vows = require('vows');
var assert = require('assert');

var specification = require('../lib/specification');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows.describe('specification').addBatch({
	'The RabbitMQ 0-9-1-extended specification' : {
		topic : function() {
			var self = this;
			specification.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function() {
				specification.getSpecification(function(spec) {
					self.callback(null, spec);
				});
			});
		},
		'path' : {
			topic : function(spec) {
				return spec.path;
			},
			'should match the specification source' : function(path) {
				var sourcePath = 'rabbitmq/full/amqp0-9-1.stripped.extended';
				assert.strictEqual(path, sourcePath);
			}
		},
		'amqp version' : {
			topic : function(spec) {
				return spec.amqp;
			},
			'should be 0-9-1' : function(version) {
				assert.strictEqual(version.major, '0');
				assert.strictEqual(version.minor, '9');
				assert.strictEqual(version.revision, '1');
			}
		}
	}
}).export(module);
