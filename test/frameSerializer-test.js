var vows = require('vows');
var assert = require('assert');

var specification = require('../lib/specification');
var FrameSerializer = require('../lib/frameSerializer');

var puts = require('vows').console.puts({
	stream : process.stdout
});

vows
		.describe('frameSerializer')
		.addBatch(
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
							'1092066989945895' : function(serialize) {
								var value = 1092066989945895;
								var buffer = new Buffer(8);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '0003e13aa901b427');
							},
							'\'0363e13aa901b429\'' : function(serialize) {
								var value = '0363e13aa901b427';
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
							'\'ffffffffffffffff\'' : function(serialize) {
								var value = 'ffffffffffffffff';
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
							'1092066989945895' : function(serialize) {
								var value = 1092066989945895;
								var buffer = new Buffer(8);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '0003e13aa901b427');
							},
							'\'0363e13aa901b429\'' : function(serialize) {
								var value = '0363e13aa901b427';
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
							'\'ffffffffffffffff\'' : function(serialize) {
								var value = 'ffffffffffffffff';
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
								for (var i = 0; i < 8; i++) {
									serialize(buffer, value[i], i);
								}
								assert.strictEqual(buffer.toString('hex'), '00');
							},
							't t t t t t t t' : function(serialize) {
								var value = [ true, true, true, true, true, true, true, true ];
								var buffer = new Buffer(1);
								buffer.used = 0;
								for (var i = 0; i < 8; i++) {
									serialize(buffer, value[i], i);
								}
								assert.strictEqual(buffer.toString('hex'), 'ff');
							},
							't t f t f t f t' : function(serialize) {
								var value = [ true, true, false, true, false, true, false, true ];
								var buffer = new Buffer(1);
								buffer.used = 0;
								for (var i = 0; i < 8; i++) {
									serialize(buffer, value[i], i);
								}
								assert.strictEqual(buffer.toString('hex'), 'ab');
							},
							't t f t f t f t t t' : function(serialize) {
								var value = [ true, true, false, true, false, true, false, true, true, true ];
								var buffer = new Buffer(2);
								buffer.used = 0;
								for (var i = 0; i < 10; i++) {
									serialize(buffer, value[i], i);
								}
								assert.strictEqual(buffer.toString('hex'), 'ab03');
							},
							't t f t f t f t t t f t f t f t' : function(serialize) {
								var value = [ true, true, false, true, false, true, false, true, true, true, false,
										true, false, true, false, true ];
								var buffer = new Buffer(2);
								buffer.used = 0;
								for (var i = 0; i < 16; i++) {
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
						},
						'should properly serialize Timestamp' : {
							topic : function(serializer) {
								return serializer.serializeTimestamp.bind(serializer);
							},
							'Thu, 01 Jan 1970 00:00:00 GMT' : function(serialize) {
								var value = new Date('Thu, 01 Jan 1970 00:00:00 GMT');
								var buffer = new Buffer(8);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '0000000000000000');
							},
							'Wed, 31 Dec 1969 23:59:59 GMT' : function(serialize) {
								var value = new Date('Wed, 31 Dec 1969 23:59:59 GMT');
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
								assert.notStrictEqual(buffer.toString('hex'), '0000000000000000');
								// TODO test correct value
							}
						},
						'should properly serialize Short String' : {
							topic : function(serializer) {
								return serializer.serializeShortString.bind(serializer);
							},
							'\'Hello World!\'' : function(serialize) {
								var value = 'Hello World!';
								var buffer = new Buffer(13);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '0c48656c6c6f20576f726c6421');
							},
							'\'\'' : function(serialize) {
								var value = '';
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
						'should properly serialize Long String' : {
							topic : function(serializer) {
								return serializer.serializeLongString.bind(serializer);
							},
							'\'Lorem ipsum dolor sit amet...\'' : function(serialize) {
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
							},
							'\'\'' : function(serialize) {
								var value = '';
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							}
						},
						'should properly serialize Byte Array' : {
							topic : function(serializer) {
								return serializer.serializeByteArray.bind(serializer);
							},
							'0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef' : function(serialize) {
								var value = new Buffer([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef ]);
								var buffer = new Buffer(12);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '000000080123456789abcdef');
							},
							'<empty Buffer>' : function(serialize) {
								var value = new Buffer([]);
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							}
						},
						'should properly serialize Void' : {
							topic : function(serializer) {
								return serializer.serializeVoid.bind(serializer);
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(0);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '');
							}
						},
						'should properly serialize Array' : {
							topic : function(serializer) {
								return serializer.serializeArray.bind(serializer);
							},
							'[]' : function(serialize) {
								var value = [];
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							},
							'[{type:\'Void\',data:undefined},{type:\'Signed 8-bit\',data:49}]' : function(serialize) {
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
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							}
						},
						'should properly serialize Table' : {
							topic : function(serializer) {
								return serializer.serializeTable.bind(serializer);
							},
							'{}' : function(serialize) {
								var value = {};
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							},
							'{test:{type:\'Signed 8-bit\',data:49}}' : function(serialize) {
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
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(4);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '00000000');
							}
						},
						'should properly serialize Value' : {
							topic : function(serializer) {
								return serializer.serializeValue.bind(serializer);
							},
							'{type:\'Boolean\',data:true}' : function(serialize) {
								var value = {
									type : 'Boolean',
									data : true
								};
								var buffer = new Buffer(2);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '7401');
							},
							'{type:\'Signed 8-bit\',data:3}' : function(serialize) {
								var value = {
									type : 'Signed 8-bit',
									data : 3
								};
								var buffer = new Buffer(2);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '6203');
							},
							'{type:\'Signed 16-bit\',data:-15}' : function(serialize) {
								var value = {
									type : 'Signed 16-bit',
									data : -15
								};
								var buffer = new Buffer(3);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '73fff1');
							},
							'{type:\'Signed 32-bit\',data:-972143}' : function(serialize) {
								var value = {
									type : 'Signed 32-bit',
									data : -972143
								};
								var buffer = new Buffer(5);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '49fff12a91');
							},
							'{type:\'Signed 64-bit\',data:180140122183954}' : function(serialize) {
								var value = {
									type : 'Signed 64-bit',
									data : 180140122183954
								};
								var buffer = new Buffer(9);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '6c0000a3d623fe1912');
							},
							'{type:\'32-bit float\',data:9.974403355091338e-23}' : function(serialize) {
								var value = {
									type : '32-bit float',
									data : 9.974403355091338e-23
								};
								var buffer = new Buffer(5);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '661af12a91');
							},
							'{type:\'64-bit float\',data:8.90010458087363e-310}' : function(serialize) {
								var value = {
									type : '64-bit float',
									data : 8.90010458087363e-310
								};
								var buffer = new Buffer(9);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '640000a3d623fe1912');
							},
							'{type:\'Decimal\',data:{digits:2,value:3.5}}' : function(serialize) {
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
							},
							'{type:\'Long string\',data:\'wuttwutt\'}' : function(serialize) {
								var value = {
									type : 'Long string',
									data : 'wuttwutt'
								};
								var buffer = new Buffer(13);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '53000000087775747477757474');
							},
							'{type:\'Array\',data:[{type:\'Void\',data:undefined},{type:\'Signed 8-bit\',data:49}]}' : function(
									serialize) {
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
							},
							'{type:\'Timestamp\',data:new Date(\'Thu, 14 Nov 2013 19:32:57 GMT\')}' : function(
									serialize) {
								var value = {
									type : 'Timestamp',
									data : new Date('Thu, 14 Nov 2013 19:32:57 GMT')
								};
								var buffer = new Buffer(9);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '540000000052852569');
							},
							'{type:\'Nested Table\',data:{test:{type:\'Signed 8-bit\',data:49}}}' : function(serialize) {
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
							},
							'{type:\'Void\',data:undefined}' : function(serialize) {
								var value = {
									type : 'Void',
									data : undefined
								};
								var buffer = new Buffer(1);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '56');
							},
							'{type:\'Byte array\',data:new Buffer([0x01,0x23,0x45,0x67,0x89,0xab,0xcd,0xef])}' : function(
									serialize) {
								var value = {
									type : 'Byte array',
									data : new Buffer([ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef ])
								};
								var buffer = new Buffer(13);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '78000000080123456789abcdef');
							},
							'undefined' : function(serialize) {
								var value = undefined;
								var buffer = new Buffer(1);
								buffer.used = 0;
								serialize(buffer, value);
								assert.strictEqual(buffer.toString('hex'), '56');
							}
						}
					}
				}).export(module);