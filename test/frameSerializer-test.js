var vows = require('vows');
var assert = require('assert');

var specification = require('../lib/specification');
var FrameSerializer = require('../lib/frameSerializer');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows.describe('frameSerializer').addBatch({
	'The AMQP 0-9-1-extended' : {
		topic : function() {
			var self = this;
			specification.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function() {
				specification.getSpecification(function(spec) {
					var a = new FrameSerializer(spec);
					self.callback(null, a);
				});
			});
		},
		'Octet serializer' : {
			topic : function(serializer) {
				return serializer.serializeOctet.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '03');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize 255' : function(serialize) {
				var value = 255;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ff');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			}
		},
		'Signed Octet serializer' : {
			topic : function(serializer) {
				return serializer.serializeSignedOctet.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '03');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize -3' : function(serialize) {
				var value = -3;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'fd');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize -1' : function(serialize) {
				var value = -1;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ff');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			}
		},
		'Short serializer' : {
			topic : function(serializer) {
				return serializer.serializeShort.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0003');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize 867' : function(serialize) {
				var value = 867;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize 65535' : function(serialize) {
				var value = 65535;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffff');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000');
				assert.strictEqual(buffer.used, 2);
			}
		},
		'Signed Short serializer' : {
			topic : function(serializer) {
				return serializer.serializeSignedShort.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0003');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize -3' : function(serialize) {
				var value = -3;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'fffd');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize 867' : function(serialize) {
				var value = 867;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize -1' : function(serialize) {
				var value = -1;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffff');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000');
				assert.strictEqual(buffer.used, 2);
			}
		},
		'Long serializer' : {
			topic : function(serializer) {
				return serializer.serializeLong.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000003');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 56877370' : function(serialize) {
				var value = 56877370;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363e13a');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 4294967295' : function(serialize) {
				var value = 4294967295;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffff');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Signed Long serializer' : {
			topic : function(serializer) {
				return serializer.serializeSignedLong.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000003');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize -3' : function(serialize) {
				var value = -3;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'fffffffd');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 56877370' : function(serialize) {
				var value = 56877370;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363e13a');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize -1' : function(serialize) {
				var value = -1;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffff');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Long Long serializer' : {
			topic : function(serializer) {
				return serializer.serializeLongLong.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000003');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 1092066989945895' : function(serialize) {
				var value = 1092066989945895;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0003e13aa901b427');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize \'0363e13aa901b429\'' : function(serialize) {
				var value = '0363e13aa901b427';
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363e13aa901b427');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 18446744073709551615' : function(serialize) {
				var value = 18446744073709551615;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize \'ffffffffffffffff\'' : function(serialize) {
				var value = 'ffffffffffffffff';
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000000');
				assert.strictEqual(buffer.used, 8);
			}
		},
		'Signed Long Long serializer' : {
			topic : function(serializer) {
				return serializer.serializeSignedLongLong.bind(serializer);
			},
			'should serialize 3' : function(serialize) {
				var value = 3;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000003');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize -3' : function(serialize) {
				var value = -3;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'fffffffffffffffd');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 1092066989945895' : function(serialize) {
				var value = 1092066989945895;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0003e13aa901b427');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize \'0363e13aa901b429\'' : function(serialize) {
				var value = '0363e13aa901b427';
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0363e13aa901b427');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize -1' : function(serialize) {
				var value = -1;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize \'ffffffffffffffff\'' : function(serialize) {
				var value = 'ffffffffffffffff';
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000000');
				assert.strictEqual(buffer.used, 8);
			}
		},
		'Boolean serializer' : {
			topic : function(serializer) {
				return serializer.serializeBoolean.bind(serializer);
			},
			'should serialize true' : function(serialize) {
				var value = true;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '01');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize false' : function(serialize) {
				var value = false;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize 1' : function(serialize) {
				var value = 1;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '01');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize 0' : function(serialize) {
				var value = 0;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			}
		},
		'Float serializer' : {
			topic : function(serializer) {
				return serializer.serializeFloat.bind(serializer);
			},
			'should serialize 1' : function(serialize) {
				var value = 1;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3f800000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize -2' : function(serialize) {
				var value = -2;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'c0000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 3.4028234663852886e+38' : function(serialize) {
				var value = 3.4028234663852886e+38;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7f7fffff');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 0' : function(serialize) {
				var value = 0;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize -0' : function(serialize) {
				var value = -0;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '80000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize Infinity' : function(serialize) {
				var value = Infinity;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7f800000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize -Infinity' : function(serialize) {
				var value = -Infinity;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ff800000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize NaN' : function(serialize) {
				var value = NaN;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7fc00000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize 1/3' : function(serialize) {
				var value = 1 / 3;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3eaaaaab');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Double serializer' : {
			topic : function(serializer) {
				return serializer.serializeDouble.bind(serializer);
			},
			'should serialize 1' : function(serialize) {
				var value = 1;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3ff0000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 1.0000000000000002' : function(serialize) {
				var value = 1.0000000000000002;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3ff0000000000001');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 1.0000000000000004' : function(serialize) {
				var value = 1.0000000000000004;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3ff0000000000002');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 2' : function(serialize) {
				var value = 2;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '4000000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize -2' : function(serialize) {
				var value = -2;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'c000000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 0' : function(serialize) {
				var value = 0;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize -0' : function(serialize) {
				var value = -0;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '8000000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize Infinity' : function(serialize) {
				var value = Infinity;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7ff0000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize -Infinity' : function(serialize) {
				var value = -Infinity;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'fff0000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize NaN' : function(serialize) {
				var value = NaN;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7ff8000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize 1/3' : function(serialize) {
				var value = 1 / 3;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '3fd5555555555555');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000000');
				assert.strictEqual(buffer.used, 8);
			}
		},
		'Bit Pack serializer' : {
			topic : function(serializer) {
				return serializer.serializeBitPack.bind(serializer);
			},
			'should serialize f f f f f f f f' : function(serialize) {
				var value = [ false, false, false, false, false, false, false, false ];
				var buffer = new Buffer(1);
				buffer.used = 0;
				for (var i = 0; i < 8; i++) {
					serialize(buffer, value[i], i);
				}
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize t t t t t t t t' : function(serialize) {
				var value = [ true, true, true, true, true, true, true, true ];
				var buffer = new Buffer(1);
				buffer.used = 0;
				for (var i = 0; i < 8; i++) {
					serialize(buffer, value[i], i);
				}
				assert.strictEqual(buffer.toString('hex'), 'ff');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize t t f t f t f t' : function(serialize) {
				var value = [ true, true, false, true, false, true, false, true ];
				var buffer = new Buffer(1);
				buffer.used = 0;
				for (var i = 0; i < 8; i++) {
					serialize(buffer, value[i], i);
				}
				assert.strictEqual(buffer.toString('hex'), 'ab');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize t t f t f t f t t t' : function(serialize) {
				var value = [ true, true, false, true, false, true, false, true, true, true ];
				var buffer = new Buffer(2);
				buffer.used = 0;
				for (var i = 0; i < 10; i++) {
					serialize(buffer, value[i], i);
				}
				assert.strictEqual(buffer.toString('hex'), 'ab03');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize t t f t f t f t t t f t f t f t' : function(serialize) {
				var value = [ true, true, false, true, false, true, false, true, true, true, false,
						true, false, true, false, true ];
				var buffer = new Buffer(2);
				buffer.used = 0;
				for (var i = 0; i < 16; i++) {
					serialize(buffer, value[i], i);
				}
				assert.strictEqual(buffer.toString('hex'), 'abab');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value, 0);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			}
		},
		'Decimal serializer' : {
			topic : function(serializer) {
				return serializer.serializeDecimal.bind(serializer);
			},
			'should serialize 0' : function(serialize) {
				var value = {
					digits : 0,
					value : 0
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize 3' : function(serialize) {
				var value = {
					digits : 0,
					value : 3
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000003');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize 0.03' : function(serialize) {
				var value = {
					digits : 2,
					value : 0.03
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0200000003');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize -0.03' : function(serialize) {
				var value = {
					digits : 2,
					value : -0.03
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '02fffffffd');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000');
				assert.strictEqual(buffer.used, 5);
			}
		},
		'Timestamp serializer' : {
			topic : function(serializer) {
				return serializer.serializeTimestamp.bind(serializer);
			},
			'should serialize Thu, 01 Jan 1970 00:00:00 GMT' : function(serialize) {
				var value = new Date('Thu, 01 Jan 1970 00:00:00 GMT');
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000000000000');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize Wed, 31 Dec 1969 23:59:59 GMT' : function(serialize) {
				var value = new Date('Wed, 31 Dec 1969 23:59:59 GMT');
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.notStrictEqual(buffer.toString('hex'), '0000000000000000');
				// TODO test correct value
				assert.strictEqual(buffer.used, 8);
			}
		},
		'Short String serializer' : {
			topic : function(serializer) {
				return serializer.serializeShortString.bind(serializer);
			},
			'should serialize \'Hello World!\'' : function(serialize) {
				var value = 'Hello World!';
				var buffer = new Buffer(13);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0c48656c6c6f20576f726c6421');
				assert.strictEqual(buffer.used, 13);
			},
			'should serialize \'\'' : function(serialize) {
				var value = '';
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00');
				assert.strictEqual(buffer.used, 1);
			}
		},
		'Long String serializer' : {
			topic : function(serializer) {
				return serializer.serializeLongString.bind(serializer);
			},
			'should serialize \'Lorem ipsum dolor sit amet...\'' : function(serialize) {
				var value = 'Lorem ipsum dolor sit amet, consectetur '
						+ 'adipiscing elit. Pellentesque mattis sollicitudin nibh vel tincidunt. '
						+ 'Nunc at nunc consequat, rutrum purus in, venenatis risus. Donec libero '
						+ 'lorem, tincidunt vel leo eget, fermentum accumsan risus. Donec mauris '
						+ 'mauris, eleifend in leo sed, vestibulum dictum ante. Vivamus bibendum '
						+ 'venenatis nisi ut elementum. Donec ultricies commodo laoreet. Maecenas '
						+ 'facilisis nunc at pretium tristique. Donec elit lectus, dictum id felis '
						+ 'ac, lacinia tincidunt erat volutpat. ';
				var buffer = new Buffer(505);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '000001f54c6f72656d20697073756d20646'
						+ 'f6c6f722073697420616d65742c20636f6e73656374657475722061646970697363696e'
						+ '6720656c69742e2050656c6c656e746573717565206d617474697320736f6c6c6963697'
						+ '47564696e206e6962682076656c2074696e636964756e742e204e756e63206174206e75'
						+ '6e6320636f6e7365717561742c2072757472756d20707572757320696e2c2076656e656'
						+ 'e617469732072697375732e20446f6e6563206c696265726f206c6f72656d2c2074696e'
						+ '636964756e742076656c206c656f20656765742c206665726d656e74756d20616363756'
						+ 'd73616e2072697375732e20446f6e6563206d6175726973206d61757269732c20656c65'
						+ '6966656e6420696e206c656f207365642c20766573746962756c756d2064696374756d2'
						+ '0616e74652e20566976616d757320626962656e64756d2076656e656e61746973206e69'
						+ '736920757420656c656d656e74756d2e20446f6e656320756c7472696369657320636f6'
						+ 'd6d6f646f206c616f726565742e204d616563656e617320666163696c69736973206e75'
						+ '6e63206174207072657469756d207472697374697175652e20446f6e656320656c69742'
						+ '06c65637475732c2064696374756d2069642066656c69732061632c206c6163696e6961'
						+ '2074696e636964756e74206572617420766f6c75747061742e20');
				assert.strictEqual(buffer.used, 505);
			},
			'should serialize \'\'' : function(serialize) {
				var value = '';
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Byte Array serializer' : {
			topic : function(serializer) {
				return serializer.serializeByteArray.bind(serializer);
			},
			'should serialize 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef' : function(serialize) {
				var value = new Buffer([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef ]);
				var buffer = new Buffer(12);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '000000080123456789abcdef');
				assert.strictEqual(buffer.used, 12);
			},
			'should serialize <empty Buffer>' : function(serialize) {
				var value = new Buffer([]);
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Void serializer' : {
			topic : function(serializer) {
				return serializer.serializeVoid.bind(serializer);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(0);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '');
				assert.strictEqual(buffer.used, 0);
			}
		},
		'Array serializer' : {
			topic : function(serializer) {
				return serializer.serializeArray.bind(serializer);
			},
			'should serialize []' : function(serialize) {
				var value = [];
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize [{type:\'Void\',data:undefined},{type:\'Signed 8-bit\',data:49}]' : function(serialize) {
				var value = [ {
					type : 'Void',
					data : undefined
				}, {
					type : 'Signed 8-bit',
					data : 49
				} ];
				var buffer = new Buffer(7);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000003566231');
				assert.strictEqual(buffer.used, 7);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Table serializer' : {
			topic : function(serializer) {
				return serializer.serializeTable.bind(serializer);
			},
			'should serialize {}' : function(serialize) {
				var value = {};
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			},
			'should serialize {test:{type:\'Signed 8-bit\',data:49}}' : function(serialize) {
				var value = {
					test : {
						type : 'Signed 8-bit',
						data : 49
					}
				};
				var buffer = new Buffer(11);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '0000000704746573746231');
				assert.strictEqual(buffer.used, 11);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(4);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '00000000');
				assert.strictEqual(buffer.used, 4);
			}
		},
		'Value serializer' : {
			topic : function(serializer) {
				return serializer.serializeValue.bind(serializer);
			},
			'should serialize {type:\'Boolean\',data:true}' : function(serialize) {
				var value = {
					type : 'Boolean',
					data : true
				};
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '7401');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize {type:\'Signed 8-bit\',data:3}' : function(serialize) {
				var value = {
					type : 'Signed 8-bit',
					data : 3
				};
				var buffer = new Buffer(2);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '6203');
				assert.strictEqual(buffer.used, 2);
			},
			'should serialize {type:\'Signed 16-bit\',data:-15}' : function(serialize) {
				var value = {
					type : 'Signed 16-bit',
					data : -15
				};
				var buffer = new Buffer(3);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '73fff1');
				assert.strictEqual(buffer.used, 3);
			},
			'should serialize {type:\'Signed 32-bit\',data:-972143}' : function(serialize) {
				var value = {
					type : 'Signed 32-bit',
					data : -972143
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '49fff12a91');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize {type:\'Signed 64-bit\',data:180140122183954}' : function(serialize) {
				var value = {
					type : 'Signed 64-bit',
					data : 180140122183954
				};
				var buffer = new Buffer(9);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '6c0000a3d623fe1912');
				assert.strictEqual(buffer.used, 9);
			},
			'should serialize {type:\'32-bit float\',data:9.974403355091338e-23}' : function(serialize) {
				var value = {
					type : '32-bit float',
					data : 9.974403355091338e-23
				};
				var buffer = new Buffer(5);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '661af12a91');
				assert.strictEqual(buffer.used, 5);
			},
			'should serialize {type:\'64-bit float\',data:8.90010458087363e-310}' : function(serialize) {
				var value = {
					type : '64-bit float',
					data : 8.90010458087363e-310
				};
				var buffer = new Buffer(9);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '640000a3d623fe1912');
				assert.strictEqual(buffer.used, 9);
			},
			'should serialize {type:\'Decimal\',data:{digits:2,value:3.5}}' : function(serialize) {
				var value = {
					type : 'Decimal',
					data : {
						digits : 2,
						value : 3.5
					}
				};
				var buffer = new Buffer(6);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '44020000015e');
				assert.strictEqual(buffer.used, 6);
			},
			'should serialize {type:\'Long string\',data:\'wuttwutt\'}' : function(serialize) {
				var value = {
					type : 'Long string',
					data : 'wuttwutt'
				};
				var buffer = new Buffer(13);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '53000000087775747477757474');
				assert.strictEqual(buffer.used, 13);
			},
			'should serialize {type:\'Array\',data:[{type:\'Void\',data:undefined},{type:\'Signed 8-bit\',data:49}]}' : function(serialize) {
				var value = {
					type : 'Array',
					data : [ {
						type : 'Void',
						data : undefined
					}, {
						type : 'Signed 8-bit',
						data : 49
					} ]
				};
				var buffer = new Buffer(8);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '4100000003566231');
				assert.strictEqual(buffer.used, 8);
			},
			'should serialize {type:\'Timestamp\',data:new Date(\'Thu, 14 Nov 2013 19:32:57 GMT\')}' : function(serialize) {
				var value = {
					type : 'Timestamp',
					data : new Date('Thu, 14 Nov 2013 19:32:57 GMT')
				};
				var buffer = new Buffer(9);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '540000000052852569');
				assert.strictEqual(buffer.used, 9);
			},
			'should serialize {type:\'Nested Table\',data:{test:{type:\'Signed 8-bit\',data:49}}}' : function(serialize) {
				var value = {
					type : 'Nested Table',
					data : {
						test : {
							type : 'Signed 8-bit',
							data : 49
						}
					}
				};
				var buffer = new Buffer(12);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '460000000704746573746231');
				assert.strictEqual(buffer.used, 12);
			},
			'should serialize {type:\'Void\',data:undefined}' : function(serialize) {
				var value = {
					type : 'Void',
					data : undefined
				};
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '56');
				assert.strictEqual(buffer.used, 1);
			},
			'should serialize {type:\'Byte array\',data:new Buffer([0x01,0x23,0x45,0x67,0x89,0xab,0xcd,0xef])}' : function(serialize) {
				var value = {
					type : 'Byte array',
					data : new Buffer([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef ])
				};
				var buffer = new Buffer(13);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '78000000080123456789abcdef');
				assert.strictEqual(buffer.used, 13);
			},
			'should serialize undefined' : function(serialize) {
				var value = undefined;
				var buffer = new Buffer(1);
				buffer.used = 0;
				serialize(buffer, value);
				assert.strictEqual(buffer.toString('hex'), '56');
				assert.strictEqual(buffer.used, 1);
			}
		}
	}
}).export(module);
