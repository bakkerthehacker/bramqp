var vows = require('vows');
var assert = require('assert');

var specification = require('../lib/specification');
var FrameSerializer = require('../lib/frameSerializer');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows.describe('frameSerializer').addBatch(
		{
			'The AMQP frame serializer' : {
				topic : function() {
					var self = this;
					specification.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function() {
						specification.getSpecification(function(spec) {
							var a = new FrameSerializer(spec);
							self.callback(null, a);
						});
					});
				},
				'should properly serialize Octet' : {
					topic : function(serializer) {
						return serializer.serializeOctet.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '03');
					},
					'255' : function(serialize) {
						var value = 255;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00');
					}
				},
				'should properly serialize Signed Octet' : {
					topic : function(serializer) {
						return serializer.serializeSignedOctet.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '03');
					},
					'-3' : function(serialize) {
						var value = -3;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'fd');
					},
					'-1' : function(serialize) {
						var value = -1;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00');
					}
				},
				'should properly serialize Short' : {
					topic : function(serializer) {
						return serializer.serializeShort.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0003');
					},
					'867' : function(serialize) {
						var value = 867;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363');
					},
					'65535' : function(serialize) {
						var value = 65535;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000');
					}
				},
				'should properly serialize Signed Short' : {
					topic : function(serializer) {
						return serializer.serializeSignedShort.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0003');
					},
					'-3' : function(serialize) {
						var value = -3;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'fffd');
					},
					'867' : function(serialize) {
						var value = 867;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363');
					},
					'-1' : function(serialize) {
						var value = -1;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(2);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000');
					}
				},
				'should properly serialize Long' : {
					topic : function(serializer) {
						return serializer.serializeLong.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000003');
					},
					'56877370' : function(serialize) {
						var value = 56877370;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363e13a');
					},
					'4294967295' : function(serialize) {
						var value = 4294967295;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffffffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000000');
					}
				},
				'should properly serialize Signed Long' : {
					topic : function(serializer) {
						return serializer.serializeSignedLong.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000003');
					},
					'-3' : function(serialize) {
						var value = -3;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'fffffffd');
					},
					'56877370' : function(serialize) {
						var value = 56877370;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363e13a');
					},
					'-1' : function(serialize) {
						var value = -1;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffffffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000000');
					}
				},
				'should properly serialize Long Long' : {
					topic : function(serializer) {
						return serializer.serializeLongLong.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000003');
					},
					'244286446867952679' : function(serialize) {
						var value = 244286446867952679;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363e13aa901b427');
					},
					'18446744073709551615' : function(serialize) {
						var value = 18446744073709551615;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000000');
					}
				},
				'should properly serialize Signed Long Long' : {
					topic : function(serializer) {
						return serializer.serializeSignedLongLong.bind(serializer);
					},
					'3' : function(serialize) {
						var value = 3;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000003');
					},
					'-3' : function(serialize) {
						var value = -3;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'fffffffffffffffd');
					},
					'244286446867952679' : function(serialize) {
						var value = 244286446867952679;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0363e13aa901b427');
					},
					'-1' : function(serialize) {
						var value = -1;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ffffffffffffffff');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000000');
					}
				},
				'should properly serialize Boolean' : {
					topic : function(serializer) {
						return serializer.serializeBoolean.bind(serializer);
					},
					'true' : function(serialize) {
						var value = true;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '01');
					},
					'false' : function(serialize) {
						var value = false;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00');
					},
					'1' : function(serialize) {
						var value = 1;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '01');
					},
					'0' : function(serialize) {
						var value = 0;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00');
					}
				},
				'should properly serialize Float' : {
					topic : function(serializer) {
						return serializer.serializeFloat.bind(serializer);
					},
					'1' : function(serialize) {
						var value = 1;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3f800000');
					},
					'-2' : function(serialize) {
						var value = -2;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'c0000000');
					},
					'3.4028234663852886e+38' : function(serialize) {
						var value = 3.4028234663852886e+38;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '7f7fffff');
					},
					'0' : function(serialize) {
						var value = 0;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000000');
					},
					'-0' : function(serialize) {
						var value = -0;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '80000000');
					},
					'Infinity' : function(serialize) {
						var value = Infinity;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '7f800000');
					},
					'-Infinity' : function(serialize) {
						var value = -Infinity;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'ff800000');
					},
					'NaN' : function(serialize) {
						var value = NaN;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '7fc00000');
					},
					'1/3' : function(serialize) {
						var value = 1 / 3;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3eaaaaab');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(4);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '00000000');
					}
				},
				'should properly serialize Double' : {
					topic : function(serializer) {
						return serializer.serializeDouble.bind(serializer);
					},
					'1' : function(serialize) {
						var value = 1;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3ff0000000000000');
					},
					'1.0000000000000002' : function(serialize) {
						var value = 1.0000000000000002;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3ff0000000000001');
					},
					'1.0000000000000004' : function(serialize) {
						var value = 1.0000000000000004;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3ff0000000000002');
					},
					'2' : function(serialize) {
						var value = 2;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '4000000000000000');
					},
					'-2' : function(serialize) {
						var value = -2;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'c000000000000000');
					},
					'0' : function(serialize) {
						var value = 0;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000000');
					},
					'-0' : function(serialize) {
						var value = -0;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '8000000000000000');
					},
					'Infinity' : function(serialize) {
						var value = Infinity;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '7ff0000000000000');
					},
					'-Infinity' : function(serialize) {
						var value = -Infinity;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), 'fff0000000000000');
					},
					'NaN' : function(serialize) {
						var value = NaN;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '7ff8000000000000');
					},
					'1/3' : function(serialize) {
						var value = 1 / 3;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '3fd5555555555555');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(8);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000000000');
					}
				},
				'should properly serialize Bit Pack' : {
					topic : function(serializer) {
						return serializer.serializeBitPack.bind(serializer);
					},
					'f f f f f f f f' : function(serialize) {
						var value = [ false, false, false, false, false, false, false, false ];
						var buffer = new Buffer(1);
						buffer.used = 0;
						for ( var i = 0; i < 8; i++) {
							serialize(buffer, value[i], i);
						}
						assert.strictEqual(buffer.toString('hex'), '00');
					},
					't t t t t t t t' : function(serialize) {
						var value = [ true, true, true, true, true, true, true, true ];
						var buffer = new Buffer(1);
						buffer.used = 0;
						for ( var i = 0; i < 8; i++) {
							serialize(buffer, value[i], i);
						}
						assert.strictEqual(buffer.toString('hex'), 'ff');
					},
					't t f t f t f t' : function(serialize) {
						var value = [ true, true, false, true, false, true, false, true ];
						var buffer = new Buffer(1);
						buffer.used = 0;
						for ( var i = 0; i < 8; i++) {
							serialize(buffer, value[i], i);
						}
						assert.strictEqual(buffer.toString('hex'), 'ab');
					},
					't t f t f t f t t t' : function(serialize) {
						var value = [ true, true, false, true, false, true, false, true, true, true ];
						var buffer = new Buffer(2);
						buffer.used = 0;
						for ( var i = 0; i < 10; i++) {
							serialize(buffer, value[i], i);
						}
						assert.strictEqual(buffer.toString('hex'), 'ab03');
					},
					't t f t f t f t t t f t f t f t' : function(serialize) {
						var value = [ true, true, false, true, false, true, false, true, true, true, false, true,
								false, true, false, true ];
						var buffer = new Buffer(2);
						buffer.used = 0;
						for ( var i = 0; i < 16; i++) {
							serialize(buffer, value[i], i);
						}
						assert.strictEqual(buffer.toString('hex'), 'abab');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(1);
						buffer.used = 0;
						serialize(buffer, value, 0);
						assert.strictEqual(buffer.toString('hex'), '00');
					}
				},
				'should properly serialize Decimal' : {
					topic : function(serializer) {
						return serializer.serializeDecimal.bind(serializer);
					},
					'0' : function(serialize) {
						var value = {
							digits : 0,
							value : 0
						};
						var buffer = new Buffer(5);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000');
					},
					'3' : function(serialize) {
						var value = {
							digits : 0,
							value : 3
						};
						var buffer = new Buffer(5);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000003');
					},
					'0.03' : function(serialize) {
						var value = {
							digits : 2,
							value : 0.03
						};
						var buffer = new Buffer(5);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0200000003');
					},
					'-0.03' : function(serialize) {
						var value = {
							digits : 2,
							value : -0.03
						};
						var buffer = new Buffer(5);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '02fffffffd');
					},
					'undefined' : function(serialize) {
						var value = undefined;
						var buffer = new Buffer(5);
						buffer.used = 0;
						serialize(buffer, value);
						assert.strictEqual(buffer.toString('hex'), '0000000000');
					}
				}
			}
		}).export(module);