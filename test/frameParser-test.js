var vows = require('vows');
var assert = require('assert');

var specification = require('../lib/specification');
var FrameParser = require('../lib/frameParser');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows.describe('frameParser').addBatch(
		{
			'The AMQP frame parser' : {
				topic : function() {
					var self = this;
					specification.selectSpecification('rabbitmq/full/amqp0-9-1.stripped.extended', function() {
						specification.getSpecification(function(spec) {
							self.callback(null, new FrameParser(spec));
						});
					});
				},
				'should properly parse Octet' : {
					topic : function(parser) {
						return parser.parseOctet.bind(parser);
					},
					'0x03' : function(parse) {
						var buffer = new Buffer([ 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0xff' : function(parse) {
						var buffer = new Buffer([ 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 255);
					}
				},
				'should properly parse Signed Octet' : {
					topic : function(parser) {
						return parser.parseSignedOctet.bind(parser);
					},
					'0x03' : function(parse) {
						var buffer = new Buffer([ 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0xfd' : function(parse) {
						var buffer = new Buffer([ 0xfd ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -3);
					},
					'0xff' : function(parse) {
						var buffer = new Buffer([ 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -1);
					}
				},
				'should properly parse Short' : {
					topic : function(parser) {
						return parser.parseShort.bind(parser);
					},
					'0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0x03, 0x63' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 867);
					},
					'0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 65535);
					}
				},
				'should properly parse Signed Short' : {
					topic : function(parser) {
						return parser.parseSignedShort.bind(parser);
					},
					'0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0xff, 0xfd' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xfd ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -3);
					},
					'0x03, 0x63' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 867);
					},
					'0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -1);
					}
				},
				'should properly parse Long' : {
					topic : function(parser) {
						return parser.parseLong.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0x03, 0x63, 0xe1, 0x3a' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63, 0xe1, 0x3a ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 56877370);
					},
					'0xff, 0xff, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 4294967295);
					}
				},
				'should properly parse Signed Long' : {
					topic : function(parser) {
						return parser.parseSignedLong.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0xff, 0xff, 0xff, 0xfd' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xfd ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -3);
					},
					'0x03, 0x63, 0xe1, 0x3a' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63, 0xe1, 0x3a ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 56877370);
					},
					'0xff, 0xff, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -1);
					}
				},
				'should properly parse Long Long' : {
					// NOTICE!!
					// These tests may still pass for different values,
					// due to
					// javascript having a maximum integer size of 2^53
					topic : function(parser) {
						return parser.parseLongLong.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0x03, 0x63, 0xe1, 0x3a, 0xa9, 0x01, 0xb4, 0x27' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63, 0xe1, 0x3a, 0xa9, 0x01, 0xb4, 0x27 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 244286446867952679);
					},
					'0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 18446744073709551615);
					}
				},
				'should properly parse Signed Long Long' : {
					// NOTICE!!
					// These tests may still pass for different values,
					// due to
					// javascript having a maximum integer size of 2^53
					topic : function(parser) {
						return parser.parseSignedLongLong.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfd' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfd ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -3);
					},
					'0x03, 0x63, 0xe1, 0x3a, 0xa9, 0x01, 0xb4, 0x27' : function(parse) {
						var buffer = new Buffer([ 0x03, 0x63, 0xe1, 0x3a, 0xa9, 0x01, 0xb4, 0x27 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 244286446867952679);
					},
					'0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -1);
					}
				},
				'should properly parse Boolean' : {
					topic : function(parser) {
						return parser.parseBoolean.bind(parser);
					},
					'0x00' : function(parse) {
						var buffer = new Buffer([ 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isFalse(value);
					},
					'0x01' : function(parse) {
						var buffer = new Buffer([ 0x01 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isTrue(value);
					},
					'0xff' : function(parse) {
						var buffer = new Buffer([ 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isTrue(value);
					}
				},
				'should properly parse Float' : {
					topic : function(parser) {
						return parser.parseFloat.bind(parser);
					},
					'0x3f, 0x80, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x3f, 0x80, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 1);
					},
					'0xc0, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0xc0, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -2);
					},
					'0x7f, 0x7f, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0x7f, 0x7f, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3.4028234663852886e+38);
					},
					'0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0);
					},
					'0x80, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x80, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -0);
					},
					'0x7f, 0x80, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x7f, 0x80, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, Infinity);
					},
					'0xff, 0x80, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0xff, 0x80, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -Infinity);
					},
					'0x7f, 0x80, 0x00, 0x01' : function(parse) {
						var buffer = new Buffer([ 0x7f, 0x80, 0x00, 0x01 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isNaN(value);
					},
					'0x3e, 0xaa, 0xaa, 0xab' : function(parse) {
						var buffer = new Buffer([ 0x3e, 0xaa, 0xaa, 0xab ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0.3333333432674408);
					}
				},
				'should properly parse Double' : {
					topic : function(parser) {
						return parser.parseDouble.bind(parser);
					},
					'0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 1);
					},
					'0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01' : function(parse) {
						var buffer = new Buffer([ 0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 1.0000000000000002);
					},
					'0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02' : function(parse) {
						var buffer = new Buffer([ 0x3f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 1.0000000000000004);
					},
					'0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 2);
					},
					'0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -2);
					},
					'0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0);
					},
					'0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -0);
					},
					'0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, Infinity);
					},
					'0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -Infinity);
					},
					'0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01' : function(parse) {
						var buffer = new Buffer([ 0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isNaN(value);
					},
					'0x3f, 0xd5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55' : function(parse) {
						var buffer = new Buffer([ 0x3f, 0xd5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0.3333333333333333);
					}
				},
				'should properly parse Bit Pack' : {
					topic : function(parser) {
						return parser.parseBitPack.bind(parser);
					},
					'0x00 (8)' : function(parse) {
						var buffer = new Buffer([ 0x00 ]);
						buffer.read = 0;
						var value = [];
						for ( var i = 0; i < 8; i++) {
							value[i] = parse(buffer, i);
						}
						assert.deepEqual(value, [ false, false, false, false, false, false, false, false ]);
					},
					'0xff (8)' : function(parse) {
						var buffer = new Buffer([ 0xff ]);
						buffer.read = 0;
						var value = [];
						for ( var i = 0; i < 8; i++) {
							value[i] = parse(buffer, i);
						}
						assert.deepEqual(value, [ true, true, true, true, true, true, true, true ]);
					},
					'0xab (8)' : function(parse) {
						var buffer = new Buffer([ 0xab ]);
						buffer.read = 0;
						var value = [];
						for ( var i = 0; i < 8; i++) {
							value[i] = parse(buffer, i);
						}
						assert.deepEqual(value, [ true, true, false, true, false, true, false, true ]);
					},
					'0xab, 0xab (10)' : function(parse) {
						var buffer = new Buffer([ 0xab, 0xab ]);
						buffer.read = 0;
						var value = [];
						for ( var i = 0; i < 10; i++) {
							value[i] = parse(buffer, i);
						}
						assert.deepEqual(value, [ true, true, false, true, false, true, false, true, true, true ]);
					},

					'0xab, 0xab (16)' : function(parse) {
						var buffer = new Buffer([ 0xab, 0xab ]);
						buffer.read = 0;
						var value = [];
						for ( var i = 0; i < 16; i++) {
							value[i] = parse(buffer, i);
						}
						assert.deepEqual(value, [ true, true, false, true, false, true, false, true, true, true, false,
								true, false, true, false, true ]);
					}
				},
				'should properly parse Decimal' : {
					topic : function(parser) {
						return parser.parseDecimal.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0);
					},
					'0x00, 0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0x02, 0x00, 0x00, 0x00, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x02, 0x00, 0x00, 0x00, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 0.03);
					},
					'0x02, 0xff, 0xff, 0xff, 0xfd' : function(parse) {
						var buffer = new Buffer([ 0x02, 0xff, 0xff, 0xff, 0xfd ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -0.03);
					}
				},
				'should properly parse Timestamp' : {
					topic : function(parser) {
						return parser.parseTimestamp.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.getTime(), new Date('Thu, 01 Jan 1970 00:00:00 GMT').getTime());
					},
					'0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff' : function(parse) {
						var buffer = new Buffer([ 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.getTime(), new Date('Wed, 31 Dec 1969 23:59:59 GMT').getTime());
					},
					'0x00, 0x00, 0x00, 0x00, 0x52, 0x85, 0x25, 0x69' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00, 0x52, 0x85, 0x25, 0x69 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.getTime(), new Date('Thu, 14 Nov 2013 19:32:57 GMT').getTime());
					}
				},
				'should properly parse Short String' : {
					topic : function(parser) {
						return parser.parseShortString.bind(parser);
					},
					'0x0c, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c, 0x64, 0x21' : function(parse) {
						var buffer = new Buffer([ 0x0c, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f, 0x72, 0x6c,
								0x64, 0x21 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 'Hello World!');
					},
					'0x00' : function(parse) {
						var buffer = new Buffer([ 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, '');
					}
				},
				'should properly parse Long String' : {
					topic : function(parser) {
						return parser.parseLongString.bind(parser);
					},
					'0x00, 0x00, 0x01, 0xf5, ...' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x01, 0xf5, 0x4c, 0x6f, 0x72, 0x65, 0x6d, 0x20, 0x69,
								0x70, 0x73, 0x75, 0x6d, 0x20, 0x64, 0x6f, 0x6c, 0x6f, 0x72, 0x20, 0x73, 0x69, 0x74,
								0x20, 0x61, 0x6d, 0x65, 0x74, 0x2c, 0x20, 0x63, 0x6f, 0x6e, 0x73, 0x65, 0x63, 0x74,
								0x65, 0x74, 0x75, 0x72, 0x20, 0x61, 0x64, 0x69, 0x70, 0x69, 0x73, 0x63, 0x69, 0x6e,
								0x67, 0x20, 0x65, 0x6c, 0x69, 0x74, 0x2e, 0x20, 0x50, 0x65, 0x6c, 0x6c, 0x65, 0x6e,
								0x74, 0x65, 0x73, 0x71, 0x75, 0x65, 0x20, 0x6d, 0x61, 0x74, 0x74, 0x69, 0x73, 0x20,
								0x73, 0x6f, 0x6c, 0x6c, 0x69, 0x63, 0x69, 0x74, 0x75, 0x64, 0x69, 0x6e, 0x20, 0x6e,
								0x69, 0x62, 0x68, 0x20, 0x76, 0x65, 0x6c, 0x20, 0x74, 0x69, 0x6e, 0x63, 0x69, 0x64,
								0x75, 0x6e, 0x74, 0x2e, 0x20, 0x4e, 0x75, 0x6e, 0x63, 0x20, 0x61, 0x74, 0x20, 0x6e,
								0x75, 0x6e, 0x63, 0x20, 0x63, 0x6f, 0x6e, 0x73, 0x65, 0x71, 0x75, 0x61, 0x74, 0x2c,
								0x20, 0x72, 0x75, 0x74, 0x72, 0x75, 0x6d, 0x20, 0x70, 0x75, 0x72, 0x75, 0x73, 0x20,
								0x69, 0x6e, 0x2c, 0x20, 0x76, 0x65, 0x6e, 0x65, 0x6e, 0x61, 0x74, 0x69, 0x73, 0x20,
								0x72, 0x69, 0x73, 0x75, 0x73, 0x2e, 0x20, 0x44, 0x6f, 0x6e, 0x65, 0x63, 0x20, 0x6c,
								0x69, 0x62, 0x65, 0x72, 0x6f, 0x20, 0x6c, 0x6f, 0x72, 0x65, 0x6d, 0x2c, 0x20, 0x74,
								0x69, 0x6e, 0x63, 0x69, 0x64, 0x75, 0x6e, 0x74, 0x20, 0x76, 0x65, 0x6c, 0x20, 0x6c,
								0x65, 0x6f, 0x20, 0x65, 0x67, 0x65, 0x74, 0x2c, 0x20, 0x66, 0x65, 0x72, 0x6d, 0x65,
								0x6e, 0x74, 0x75, 0x6d, 0x20, 0x61, 0x63, 0x63, 0x75, 0x6d, 0x73, 0x61, 0x6e, 0x20,
								0x72, 0x69, 0x73, 0x75, 0x73, 0x2e, 0x20, 0x44, 0x6f, 0x6e, 0x65, 0x63, 0x20, 0x6d,
								0x61, 0x75, 0x72, 0x69, 0x73, 0x20, 0x6d, 0x61, 0x75, 0x72, 0x69, 0x73, 0x2c, 0x20,
								0x65, 0x6c, 0x65, 0x69, 0x66, 0x65, 0x6e, 0x64, 0x20, 0x69, 0x6e, 0x20, 0x6c, 0x65,
								0x6f, 0x20, 0x73, 0x65, 0x64, 0x2c, 0x20, 0x76, 0x65, 0x73, 0x74, 0x69, 0x62, 0x75,
								0x6c, 0x75, 0x6d, 0x20, 0x64, 0x69, 0x63, 0x74, 0x75, 0x6d, 0x20, 0x61, 0x6e, 0x74,
								0x65, 0x2e, 0x20, 0x56, 0x69, 0x76, 0x61, 0x6d, 0x75, 0x73, 0x20, 0x62, 0x69, 0x62,
								0x65, 0x6e, 0x64, 0x75, 0x6d, 0x20, 0x76, 0x65, 0x6e, 0x65, 0x6e, 0x61, 0x74, 0x69,
								0x73, 0x20, 0x6e, 0x69, 0x73, 0x69, 0x20, 0x75, 0x74, 0x20, 0x65, 0x6c, 0x65, 0x6d,
								0x65, 0x6e, 0x74, 0x75, 0x6d, 0x2e, 0x20, 0x44, 0x6f, 0x6e, 0x65, 0x63, 0x20, 0x75,
								0x6c, 0x74, 0x72, 0x69, 0x63, 0x69, 0x65, 0x73, 0x20, 0x63, 0x6f, 0x6d, 0x6d, 0x6f,
								0x64, 0x6f, 0x20, 0x6c, 0x61, 0x6f, 0x72, 0x65, 0x65, 0x74, 0x2e, 0x20, 0x4d, 0x61,
								0x65, 0x63, 0x65, 0x6e, 0x61, 0x73, 0x20, 0x66, 0x61, 0x63, 0x69, 0x6c, 0x69, 0x73,
								0x69, 0x73, 0x20, 0x6e, 0x75, 0x6e, 0x63, 0x20, 0x61, 0x74, 0x20, 0x70, 0x72, 0x65,
								0x74, 0x69, 0x75, 0x6d, 0x20, 0x74, 0x72, 0x69, 0x73, 0x74, 0x69, 0x71, 0x75, 0x65,
								0x2e, 0x20, 0x44, 0x6f, 0x6e, 0x65, 0x63, 0x20, 0x65, 0x6c, 0x69, 0x74, 0x20, 0x6c,
								0x65, 0x63, 0x74, 0x75, 0x73, 0x2c, 0x20, 0x64, 0x69, 0x63, 0x74, 0x75, 0x6d, 0x20,
								0x69, 0x64, 0x20, 0x66, 0x65, 0x6c, 0x69, 0x73, 0x20, 0x61, 0x63, 0x2c, 0x20, 0x6c,
								0x61, 0x63, 0x69, 0x6e, 0x69, 0x61, 0x20, 0x74, 0x69, 0x6e, 0x63, 0x69, 0x64, 0x75,
								0x6e, 0x74, 0x20, 0x65, 0x72, 0x61, 0x74, 0x20, 0x76, 0x6f, 0x6c, 0x75, 0x74, 0x70,
								0x61, 0x74, 0x2e, 0x20 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 'Lorem ipsum dolor sit amet, consectetur '
								+ 'adipiscing elit. Pellentesque mattis sollicitudin nibh vel tincidunt. '
								+ 'Nunc at nunc consequat, rutrum purus in, venenatis risus. Donec libero '
								+ 'lorem, tincidunt vel leo eget, fermentum accumsan risus. Donec mauris '
								+ 'mauris, eleifend in leo sed, vestibulum dictum ante. Vivamus bibendum '
								+ 'venenatis nisi ut elementum. Donec ultricies commodo laoreet. Maecenas '
								+ 'facilisis nunc at pretium tristique. Donec elit lectus, dictum id felis '
								+ 'ac, lacinia tincidunt erat volutpat. ');
					},
					'0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, '');
					}

				},
				'should properly parse ByteArray' : {
					topic : function(parser) {
						return parser.parseByteArray.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x08, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x08, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd,
								0xef ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.toString('hex'), '0123456789abcdef');
					},
					'0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.toString('hex'), '');
					}
				},
				'should properly parse Void' : {
					topic : function(parser) {
						return parser.parseVoid.bind(parser);
					},
					'<empty Buffer>' : function(parse) {
						var buffer = new Buffer([]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.isUndefined(value);
					}
				},
				'should properly parse Array' : {
					topic : function(parser) {
						return parser.parseArray.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, []);
					},
					'0x00, 0x00, 0x00, 0x03, 0x56, 0x62, 0x31' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x03, 0x56, 0x62, 0x31 ]);

						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, [ undefined, 49 ]);
					}
				},
				'should properly parse Table' : {
					topic : function(parser) {
						return parser.parseTable.bind(parser);
					},
					'0x00, 0x00, 0x00, 0x00' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x00 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, {});
					},
					'0x00, 0x00, 0x00, 0x07, 0x04, 0x74, 0x65, 0x73, 0x74, 0x62, 0x31' : function(parse) {
						var buffer = new Buffer([ 0x00, 0x00, 0x00, 0x07, 0x04, 0x74, 0x65, 0x73, 0x74, 0x62, 0x31 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, {
							test : 49
						});
					}
				},
				'should properly parse Value' : {
					topic : function(parser) {
						return parser.parseValue.bind(parser);
					},
					'0x74, 0x01' : function(parse) {
						var buffer = new Buffer([ 0x74, 0x01 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, true);
					},
					'0x62, 0x03' : function(parse) {
						var buffer = new Buffer([ 0x62, 0x03 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3);
					},
					'0x73, 0xff, 0xf1' : function(parse) {
						var buffer = new Buffer([ 0x73, 0xff, 0xf1 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -15);
					},
					'0x49, 0xff, 0xf1, 0x2a, 0x91' : function(parse) {
						var buffer = new Buffer([ 0x49, 0xff, 0xf1, 0x2a, 0x91 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, -972143);
					},
					'0x6c, 0x00, 0x00, 0xa3, 0xd6, 0x23, 0xfe, 0x19, 0x12' : function(parse) {
						var buffer = new Buffer([ 0x6c, 0x00, 0x00, 0xa3, 0xd6, 0x23, 0xfe, 0x19, 0x12 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 180140122183954);
					},
					'0x66, 0x1a, 0xf1, 0x2a, 0x91' : function(parse) {
						var buffer = new Buffer([ 0x66, 0x1a, 0xf1, 0x2a, 0x91 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 9.974403355091338e-23);
					},
					'0x64, 0x00, 0x00, 0xa3, 0xd6, 0x23, 0xfe, 0x19, 0x12' : function(parse) {
						var buffer = new Buffer([ 0x64, 0x00, 0x00, 0xa3, 0xd6, 0x23, 0xfe, 0x19, 0x12 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 8.90010458087363e-310);
					},
					'0x44, 0x02, 0x00, 0x00, 0x01, 0x5e' : function(parse) {
						var buffer = new Buffer([ 0x44, 0x02, 0x00, 0x00, 0x01, 0x5e ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 3.50);
					},
					'0x53, 0x00, 0x00, 0x00, 0x08, 0x77, 0x75, 0x74, 0x74, 0x77, 0x75, 0x74, 0x74' : function(parse) {
						var buffer = new Buffer([ 0x53, 0x00, 0x00, 0x00, 0x08, 0x77, 0x75, 0x74, 0x74, 0x77, 0x75,
								0x74, 0x74 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, 'wuttwutt');
					},
					'0x41, 0x00, 0x00, 0x00, 0x03, 0x56, 0x62, 0x31' : function(parse) {
						var buffer = new Buffer([ 0x41, 0x00, 0x00, 0x00, 0x03, 0x56, 0x62, 0x31 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, [ undefined, 49 ]);
					},
					'0x54, 0x00, 0x00, 0x00, 0x00, 0x52, 0x85, 0x25, 0x69' : function(parse) {
						var buffer = new Buffer([ 0x54, 0x00, 0x00, 0x00, 0x00, 0x52, 0x85, 0x25, 0x69 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value.getTime(), new Date('Thu, 14 Nov 2013 19:32:57 GMT').getTime());
					},
					'0x46, 0x00, 0x00, 0x00, 0x07, 0x04, 0x74, 0x65, 0x73, 0x74, 0x62, 0x31' : function(parse) {
						var buffer = new Buffer([ 0x46, 0x00, 0x00, 0x00, 0x07, 0x04, 0x74, 0x65, 0x73, 0x74, 0x62,
								0x31 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.deepEqual(value, {
							test : 49
						});
					},
					'0x56' : function(parse) {
						var buffer = new Buffer([ 0x56 ]);
						buffer.read = 0;
						var value = parse(buffer);
						assert.strictEqual(value, undefined);
					},
					'0x78, 0x00, 0x00, 0x00, 0x08, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef' : function(parse) {
						var buffer = new Buffer([ 0x78, 0x00, 0x00, 0x00, 0x08, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab,
								0xcd, 0xef ]);
						buffer.read = 0;
						var value = parse(buffer);
						var testValue = new Buffer([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef ]);
						assert.strictEqual(value.length, testValue.length);
						for ( var i = 0; i < 8; i++) {
							assert.strictEqual(value[i], testValue[i]);
						}
					},
				}
			}
		}).export(module);