'use strict';
const vows = require('vows');
const assert = require('assert');
const specification = require('../lib/specification');
const puts = require('vows').console.puts({
	stream: process.stdout
});
vows.describe('specification').addBatch({
	'The RabbitMQ 0-9-1-extended specification': {
		topic: function() {
			const self = this;
			specification.fetchSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function(error, spec) {
				self.callback(error, spec);
			});
		},
		'path': {
			topic: function(spec) {
				return spec.path;
			},
			'should match the specification source': function(path) {
				const sourcePath = 'rabbitmq/full/amqp0-9-1.stripped.extended';
				assert.strictEqual(path, sourcePath);
			}
		},
		'amqp version': {
			topic: function(spec) {
				return spec.amqp;
			},
			'should be 0-9-1': function(version) {
				assert.strictEqual(version.major, '0');
				assert.strictEqual(version.minor, '9');
				assert.strictEqual(version.revision, '1');
			}
		}
	}
}).export(module);
