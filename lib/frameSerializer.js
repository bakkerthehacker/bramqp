'use strict';
const util = require('util');
const EventEmitter = require('events');
const moreints = require('buffer-more-ints');
const checkAssertion = require('./assertion').checkAssertion;
class FrameSerializer extends EventEmitter {
	constructor(spec) {
		super();
		this.specData = spec;
		this.serializeLookup = {};
		this.domainLookup = {};
		this.baseDomainLookup = {};
		this.domainAsserts = {};
		this.constantLookup = {};
		this.classLookup = {};
		this.serializeLookup['Boolean'] = this.serializeBoolean;
		this.serializeLookup['Signed 8-bit'] = this.serializeSignedOctet;
		this.serializeLookup['Unsigned 8-bit'] = this.serializeOctet;
		this.serializeLookup['Signed 16-bit'] = this.serializeSignedShort;
		this.serializeLookup['Unsigned 16-bit'] = this.serializeShort;
		this.serializeLookup['Signed 32-bit'] = this.serializeSignedLong;
		this.serializeLookup['Unsigned 32-bit'] = this.serializeLong;
		this.serializeLookup['Signed 64-bit'] = this.serializeSignedLongLong;
		this.serializeLookup['Unsigned 64-bit'] = this.serializeLongLong;
		this.serializeLookup['32-bit float'] = this.serializeFloat;
		this.serializeLookup['64-bit float'] = this.serializeDouble;
		this.serializeLookup['Decimal'] = this.serializeDecimal;
		this.serializeLookup['Short string'] = this.serializeShortString;
		this.serializeLookup['Long string'] = this.serializeLongString;
		this.serializeLookup['Array'] = this.serializeArray;
		this.serializeLookup['Timestamp'] = this.serializeTimestamp;
		this.serializeLookup['Nested Table'] = this.serializeTable;
		this.serializeLookup['Void'] = this.serializeVoid;
		this.serializeLookup['Byte array'] = this.serializeByteArray;
		this.serializeLookup['ASCII character'] = this.serializeOctet;
		this.serializeLookup['ASCII string'] = this.serializeLongString;
		this.serializeLookup['Wide string'] = this.serializeLongString;
		this.domainLookup.bit = this.serializeBitPack;
		this.domainLookup.octet = this.serializeOctet;
		this.domainLookup.short = this.serializeShort;
		this.domainLookup.long = this.serializeLong;
		this.domainLookup.longlong = this.serializeLongLong;
		this.domainLookup.shortstr = this.serializeShortString;
		this.domainLookup.longstr = this.serializeLongString;
		this.domainLookup.timestamp = this.serializeTimestamp;
		this.domainLookup.table = this.serializeTable;
		this.specData.amqp.domain.forEach((domain) => {
			this.baseDomainLookup[domain.name] = domain.type;
			if (domain.assert) {
				this.domainAsserts[domain.name] = domain.assert;
			}
		});
		const processBaseDomain = (domain) => {
			if (this.baseDomainLookup[domain] === domain) {
				return domain;
			} else {
				return processBaseDomain(this.baseDomainLookup[domain]);
			}
		};
		for (let i in this.baseDomainLookup) {
			this.baseDomainLookup[i] = processBaseDomain(this.baseDomainLookup[i]);
		}
		this.specData.amqp.constant.forEach((constant) => {
			this.constantLookup[constant.name] = constant;
		});
		this.specData.amqp['class'].forEach((theClass) => {
			this.classLookup[theClass.name] = theClass;
			theClass.method.forEach((method) => {
				this.classLookup[theClass.name][method.name] = method;
			});
		});
		this.frameMax = parseInt(this.constantLookup['frame-min-size'].value, 10);
	}
	serializeOctet(buffer, octet) {
		if (octet !== undefined) {
			buffer.writeUInt8(octet, buffer.used);
			buffer.used += 1;
		} else {
			this.serializeOctet(buffer, 0);
		}
	}
	serializeSignedOctet(buffer, octet) {
		if (octet !== undefined) {
			buffer.writeInt8(octet, buffer.used);
			buffer.used += 1;
		} else {
			this.serializeSignedOctet(buffer, 0);
		}
	}
	serializeShort(buffer, theShort) {
		if (theShort !== undefined) {
			buffer.writeUInt16BE(theShort, buffer.used);
			buffer.used += 2;
		} else {
			this.serializeShort(buffer, 0);
		}
	}
	serializeSignedShort(buffer, theShort) {
		if (theShort !== undefined) {
			buffer.writeInt16BE(theShort, buffer.used);
			buffer.used += 2;
		} else {
			this.serializeSignedShort(buffer, 0);
		}
	}
	serializeLong(buffer, theLong) {
		if (theLong !== undefined) {
			buffer.writeUInt32BE(theLong, buffer.used);
			buffer.used += 4;
		} else {
			this.serializeLong(buffer, 0);
		}
	}
	serializeSignedLong(buffer, theLong) {
			if (theLong !== undefined) {
				buffer.writeInt32BE(theLong, buffer.used);
				buffer.used += 4;
			} else {
				this.serializeSignedLong(buffer, 0);
			}
		}
		// this will fail for numbers greater than 2^53
		// use hex strings if these large numbers are needed
	serializeLongLong(buffer, longLong) {
			if (longLong !== undefined) {
				if (typeof longLong === 'string') {
					buffer.write(longLong, buffer.used, 'hex');
				} else {
					moreints.writeUInt64BE(buffer, longLong, buffer.used);
				}
				buffer.used += 8;
			} else {
				this.serializeLongLong(buffer, 0);
			}
		}
		// this will fail for numbers greater than 2^53
		// use hex strings if these large numbers are needed
	serializeSignedLongLong(buffer, longLong) {
		if (longLong !== undefined) {
			if (typeof longLong === 'string') {
				buffer.write(longLong, buffer.used, 'hex');
			} else {
				moreints.writeInt64BE(buffer, longLong, buffer.used);
			}
			buffer.used += 8;
		} else {
			this.serializeSignedLongLong(buffer, 0);
		}
	}
	serializeBoolean(buffer, theBoolean) {
		this.serializeOctet(buffer, theBoolean ? 1 : 0);
	}
	serializeFloat(buffer, theFloat) {
		if (theFloat !== undefined) {
			buffer.writeFloatBE(theFloat, buffer.used);
			buffer.used += 4;
		} else {
			this.serializeFloat(buffer, 0);
		}
	}
	serializeDouble(buffer, theDouble) {
		if (theDouble !== undefined) {
			buffer.writeDoubleBE(theDouble, buffer.used);
			buffer.used += 8;
		} else {
			this.serializeDouble(buffer, 0);
		}
	}
	serializeBitPack(buffer, bit, previousBitCount) {
		const localIndex = previousBitCount % 8;
		if (localIndex === 0) {
			this.serializeOctet(buffer, 0);
		}
		buffer.writeUInt8(buffer.readUInt8(buffer.used - 1) | (bit ? (1 << localIndex) : 0), buffer.used - 1);
	}
	serializeDecimal(buffer, data) {
		if (data !== undefined) {
			this.serializeOctet(buffer, data.digits);
			this.serializeSignedLong(buffer, data.value * Math.pow(10, data.digits));
		} else {
			this.serializeDecimal(buffer, {
				digits: 0,
				value: 0
			});
		}
	}
	serializeTimestamp(buffer, timestamp) {
		if (timestamp !== undefined) {
			this.serializeSignedLongLong(buffer, Math.floor(timestamp.getTime() / 1000));
		} else {
			this.serializeTimestamp(buffer, new Date());
		}
	}
	serializeShortString(buffer, string) {
		if (typeof string === 'string') {
			const length = Buffer.byteLength(string);
			this.serializeOctet(buffer, length);
			buffer.write(string, buffer.used);
			buffer.used += length;
		} else {
			this.serializeOctet(buffer, 0);
		}
	}
	serializeLongString(buffer, string) {
		if (typeof string === 'string') {
			const length = Buffer.byteLength(string);
			this.serializeLong(buffer, length);
			buffer.write(string, buffer.used);
			buffer.used += length;
		} else if (typeof string === 'object') {
			// Allow tables as text blocks for SALS blob
			this.serializeTable(buffer, string);
		} else {
			this.serializeLong(buffer, 0);
		}
	}
	serializeByteArray(buffer, byteBuffer) {
		if (byteBuffer !== undefined) {
			const length = byteBuffer.length;
			this.serializeLong(buffer, length);
			byteBuffer.copy(buffer, buffer.used);
			buffer.used += length;
		} else {
			this.serializeByteArray(buffer, Buffer.from([]));
		}
	}
	serializeVoid() {}
	serializeArray(buffer, array) {
		if (array instanceof Array) {
			const lengthPosition = buffer.used;
			this.serializeLong(buffer, 0);
			const start = buffer.used;
			for (let i in array) {
				this.serializeValue(buffer, array[i]);
			}
			buffer.writeUInt32BE(buffer.used - start, lengthPosition);
		} else {
			this.serializeArray(buffer, []);
		}
	}
	serializeTable(buffer, table) {
		if (typeof table === 'object') {
			const lengthPosition = buffer.used;
			this.serializeLong(buffer, 0);
			const start = buffer.used;
			for (let i in table) {
				this.serializeShortString(buffer, i);
				this.serializeValue(buffer, table[i]);
			}
			buffer.writeUInt32BE(buffer.used - start, lengthPosition);
		} else {
			this.serializeTable(buffer, {});
		}
	}
	serializeValue(buffer, value) {
		if (value !== undefined) {
			this.serializeOctet(buffer, this.specData.valueTypes[value.type]);
			this.serializeLookup[value.type].call(this, buffer, value.data);
		} else {
			this.serializeValue(buffer, {
				type: 'Void',
				data: undefined
			});
		}
	}
	serializeFields(buffer, fields, data) {
		let previousBitCount = 0;
		for (let i in fields) {
			let baseDomain = this.baseDomainLookup[fields[i].domain];
			if (!baseDomain) {
				baseDomain = fields[i].type;
			}
			let assertions = (fields[i].assert || []).concat(this.domainAsserts[fields[i].domain] || []);
			for (let j in assertions) {
				checkAssertion(data[fields[i].name], assertions[j]);
			}
			if (baseDomain === 'bit') {
				this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name], previousBitCount);
				previousBitCount += 1;
			} else {
				this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name]);
				previousBitCount = 0;
			}
		}
	}
	serializeFrameStart(buffer, type, channel, payloadSize) {
		this.serializeOctet(buffer, type);
		this.serializeShort(buffer, channel);
		this.serializeLong(buffer, payloadSize);
	}
	serializeFramePayload(buffer, payloadBuffer) {
		buffer.used += payloadBuffer.used;
	}
	serializeFrameEnd(buffer) {
		this.serializeOctet(buffer, parseInt(this.constantLookup['frame-end'].value));
	}
	serializeFrameMethod(buffer, channel, className, methodName, fieldData) {
		const methodPayload = buffer.slice(7);
		methodPayload.used = 0;
		const theClass = this.classLookup[className];
		const method = this.classLookup[className][methodName];
		this.serializeShort(methodPayload, theClass.index);
		this.serializeShort(methodPayload, method.index);
		this.serializeFields(methodPayload, method.field, fieldData);
		this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-method'].value, 10), theClass.handler === 'channel' ? channel : 0, methodPayload.used);
		this.serializeFramePayload(buffer, methodPayload);
		this.serializeFrameEnd(buffer);
		return buffer;
	}
	serializeFrameContentHeader(buffer, channel, className, bodySize, fieldData) {
		const headerPayload = buffer.slice(7);
		headerPayload.used = 0;
		const theClass = this.classLookup[className];
		this.serializeShort(headerPayload, theClass.index);
		this.serializeShort(headerPayload, 0); // weight - reserved
		this.serializeLongLong(headerPayload, bodySize);
		const fieldsPresent = [];
		const propertiesPresent = [];
		for (let fieldIndex in theClass.field) {
			const field = theClass.field[fieldIndex];
			propertiesPresent.push(fieldData[field.name] ? true : false);
			if (fieldData[field.name]) {
				if (this.baseDomainLookup[field.domain] !== 'bit') {
					fieldsPresent.push(field);
				}
			}
		}
		const propertyFlags = [];
		for (let propertiesPresentIndex in propertiesPresent) {
			const localIndex = propertiesPresentIndex % 15;
			const propertyIndex = (propertiesPresentIndex - localIndex) / 15;
			if (localIndex === 0) {
				propertyFlags[propertyIndex] = 0;
				if (propertyIndex !== 0) {
					propertyFlags[propertyIndex - 1] |= 1;
				}
			}
			if (propertiesPresent[propertiesPresentIndex]) {
				propertyFlags[propertyIndex] |= 1 << (15 - localIndex);
			}
		}
		if (!propertyFlags.length) {
			propertyFlags.push(0);
		}
		for (let propertyFlagsIndex in propertyFlags) {
			this.serializeShort(headerPayload, propertyFlags[propertyFlagsIndex]);
		}
		this.serializeFields(headerPayload, fieldsPresent, fieldData);
		this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-header'].value, 10), theClass.handler === 'channel' ? channel : 0, headerPayload.used);
		this.serializeFramePayload(buffer, headerPayload);
		this.serializeFrameEnd(buffer);
		return buffer;
	}
	serializeFrameContentBody(buffer, channel, bodyBuffer) {
		this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-body'].value, 10), channel, bodyBuffer.used);
		this.serializeFramePayload(buffer, bodyBuffer);
		this.serializeFrameEnd(buffer);
		buffer = buffer.slice(0, buffer.used);
		const contentBuffer = Buffer.concat([buffer.slice(0, 7), bodyBuffer, buffer.slice(-1)]);
		contentBuffer.used = buffer.used;
		return contentBuffer;
	}
	serializeFrameHeartbeat(buffer) {
		this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-heartbeat'].value, 10), 0, 0);
		this.serializeFrameEnd(buffer);
		return buffer;
	}
}
module.exports = FrameSerializer;
