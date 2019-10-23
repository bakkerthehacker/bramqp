'use strict';
const moreints = require('buffer-more-ints');
const { checkAssertion } = require('./assertion');
class FrameSerializer {
	constructor(spec) {
		this.specData = spec;
		this.serializeLookup = {};
		this.domainLookup = {};
		this.baseDomainLookup = {};
		this.domainAsserts = {};
		this.constantLookup = {};
		this.classLookup = this.specData.classes;
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
		for (let domain of this.specData.amqp.domain) {
			this.baseDomainLookup[domain.name] = domain.type;
			if (domain.assert) {
				this.domainAsserts[domain.name] = domain.assert;
			}
		}
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
		for (let constant of this.specData.amqp.constant) {
			this.constantLookup[constant.name] = constant;
		}
		this.reservedFieldData = {
			bit: 0,
			octet: 0,
			short: 0,
			long: 0,
			longlong: 0,
			shortstr: '',
			longstr: '',
			timestamp: new Date(),
			table: {},
		};
		this.frameMax = parseInt(this.constantLookup['frame-min-size'].value, 10);
	}
	serializeOctet(buffer, octet) {
		buffer.writeUInt8(octet, buffer.used);
		buffer.used += 1;
	}
	serializeSignedOctet(buffer, octet) {
		buffer.writeInt8(octet, buffer.used);
		buffer.used += 1;
	}
	serializeShort(buffer, theShort) {
		buffer.writeUInt16BE(theShort, buffer.used);
		buffer.used += 2;
	}
	serializeSignedShort(buffer, theShort) {
		buffer.writeInt16BE(theShort, buffer.used);
		buffer.used += 2;
	}
	serializeLong(buffer, theLong) {
		buffer.writeUInt32BE(theLong, buffer.used);
		buffer.used += 4;
	}
	serializeSignedLong(buffer, theLong) {
			buffer.writeInt32BE(theLong, buffer.used);
			buffer.used += 4;
		}
		// this will fail for numbers greater than 2^53
		// use hex strings if these large numbers are needed
	serializeLongLong(buffer, longLong) {
			if (typeof longLong === 'string') {
				buffer.write(longLong, buffer.used, 'hex');
			} else {
				moreints.writeUInt64BE(buffer, longLong, buffer.used);
			}
			buffer.used += 8;
		}
		// this will fail for numbers greater than 2^53
		// use hex strings if these large numbers are needed
	serializeSignedLongLong(buffer, longLong) {
		if (typeof longLong === 'string') {
			buffer.write(longLong, buffer.used, 'hex');
		} else {
			moreints.writeInt64BE(buffer, longLong, buffer.used);
		}
		buffer.used += 8;
	}
	serializeBoolean(buffer, theBoolean) {
		this.serializeOctet(buffer, theBoolean ? 1 : 0);
	}
	serializeFloat(buffer, theFloat) {
		buffer.writeFloatBE(theFloat, buffer.used);
		buffer.used += 4;
	}
	serializeDouble(buffer, theDouble) {
		buffer.writeDoubleBE(theDouble, buffer.used);
		buffer.used += 8;
	}
	serializeBitPack(buffer, bit, previousBitCount) {
		const localIndex = previousBitCount % 8;
		if (localIndex === 0) {
			this.serializeOctet(buffer, 0);
		}
		buffer.writeUInt8(buffer.readUInt8(buffer.used - 1) | (bit ? (1 << localIndex) : 0), buffer.used - 1);
	}
	serializeDecimal(buffer, data) {
		this.serializeOctet(buffer, data.digits);
		this.serializeSignedLong(buffer, data.value * Math.pow(10, data.digits));
	}
	serializeTimestamp(buffer, timestamp) {
		this.serializeSignedLongLong(buffer, Math.floor(timestamp.getTime() / 1000));
	}
	serializeShortString(buffer, string) {
		const length = Buffer.byteLength(string);
		this.serializeOctet(buffer, length);
		buffer.write(string, buffer.used);
		buffer.used += length;
	}
	serializeLongString(buffer, string) {
		if (typeof string === 'object') {
			// Allow tables as text blocks for SALS blob
			this.serializeTable(buffer, string);
		} else {
			const length = Buffer.byteLength(string);
			this.serializeLong(buffer, length);
			buffer.write(string, buffer.used);
			buffer.used += length;
		}
	}
	serializeByteArray(buffer, byteBuffer) {
		const length = byteBuffer.length;
		this.serializeLong(buffer, length);
		byteBuffer.copy(buffer, buffer.used);
		buffer.used += length;
	}
	serializeVoid() {}
	serializeArray(buffer, array) {
		const lengthPosition = buffer.used;
		this.serializeLong(buffer, 0);
		const start = buffer.used;
		for (let i in array) {
			this.serializeValue(buffer, array[i]);
		}
		buffer.writeUInt32BE(buffer.used - start, lengthPosition);
	}
	serializeTable(buffer, table) {
		const lengthPosition = buffer.used;
		this.serializeLong(buffer, 0);
		const start = buffer.used;
		for (let i in table) {
			this.serializeShortString(buffer, i);
			this.serializeValue(buffer, table[i]);
		}
		buffer.writeUInt32BE(buffer.used - start, lengthPosition);
	}
	serializeValue(buffer, value) {
		this.serializeOctet(buffer, this.specData.valueTypes[value.type]);
		this.serializeLookup[value.type].call(this, buffer, value.data);
	}
	serializeFields(buffer, fields, data) {
		let previousBitCount = 0;
		for (let field of fields) {
			let baseDomain = this.baseDomainLookup[field.domain];
			if (!baseDomain) {
				baseDomain = field.type;
			}
			if (field.reserved) {
				data[field.name] = this.reservedFieldData[baseDomain];
			}
			let assertions = (field.assert || []).concat(this.domainAsserts[field.domain] || []);
			for (let j in assertions) {
				checkAssertion(data[field.name], assertions[j]);
			}
			if (baseDomain === 'bit') {
				this.domainLookup[baseDomain].call(this, buffer, data[field.name], previousBitCount);
				previousBitCount += 1;
			} else {
				this.domainLookup[baseDomain].call(this, buffer, data[field.name]);
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
		this.serializeFields(methodPayload, method.field || [], fieldData);
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
