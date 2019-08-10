'use strict';
var util = require('util');
var EventEmitter = require('events');
var moreints = require('buffer-more-ints');
var checkAssertion = require('./assertion').checkAssertion;
class FrameParser extends EventEmitter {
	constructor(spec) {
		super();
		var self = this;
		this.specData = spec;
		this.parseLookup = {};
		this.domainLookup = {};
		this.frameLookup = {};
		this.classLookup = {};
		this.baseDomainLookup = {};
		this.domainAsserts = {};
		this.constantLookup = {};
		this.frameStartSize = 7;
		this.frameEndSize = 1;
		// this.frameStartBuffer;
		// this.framePayloadBuffer;
		// this.frameEndBuffer;
		//
		// this.frameType;
		// this.frameChannel;
		// this.framePayloadSize;
		this.resetFrameState();
		this.currentFrameFunction = this.parseFrameStart;
		this.parseLookup[this.specData.valueTypes['Boolean']] = this.parseBoolean;
		this.parseLookup[this.specData.valueTypes['Signed 8-bit']] = this.parseSignedOctet;
		this.parseLookup[this.specData.valueTypes['Unsigned 8-bit']] = this.parseOctet;
		this.parseLookup[this.specData.valueTypes['Signed 16-bit']] = this.parseSignedShort;
		this.parseLookup[this.specData.valueTypes['Unsigned 16-bit']] = this.parseShort;
		this.parseLookup[this.specData.valueTypes['Signed 32-bit']] = this.parseSignedLong;
		this.parseLookup[this.specData.valueTypes['Unsigned 32-bit']] = this.parseLong;
		this.parseLookup[this.specData.valueTypes['Signed 64-bit']] = this.parseSignedLongLong;
		this.parseLookup[this.specData.valueTypes['Unsigned 64-bit']] = this.parseLongLong;
		this.parseLookup[this.specData.valueTypes['32-bit float']] = this.parseFloat;
		this.parseLookup[this.specData.valueTypes['64-bit float']] = this.parseDouble;
		this.parseLookup[this.specData.valueTypes['Decimal']] = this.parseDecimal;
		this.parseLookup[this.specData.valueTypes['Short string']] = this.parseShortString;
		this.parseLookup[this.specData.valueTypes['Long string']] = this.parseLongString;
		this.parseLookup[this.specData.valueTypes['Array']] = this.parseArray;
		this.parseLookup[this.specData.valueTypes['Timestamp']] = this.parseTimestamp;
		this.parseLookup[this.specData.valueTypes['Nested Table']] = this.parseTable;
		this.parseLookup[this.specData.valueTypes['Void']] = this.parseVoid;
		this.parseLookup[this.specData.valueTypes['Byte array']] = this.parseByteArray;
		this.parseLookup[this.specData.valueTypes['ASCII character']] = this.parseOctet;
		this.parseLookup[this.specData.valueTypes['ASCII string']] = this.parseLongString;
		this.parseLookup[this.specData.valueTypes['Wide string']] = this.parseLongString;
		this.domainLookup.bit = this.parseBitPack;
		this.domainLookup.octet = this.parseOctet;
		this.domainLookup.short = this.parseShort;
		this.domainLookup.long = this.parseLong;
		this.domainLookup.longlong = this.parseLongLong;
		this.domainLookup.shortstr = this.parseShortString;
		this.domainLookup.longstr = this.parseLongString;
		this.domainLookup.timestamp = this.parseTimestamp;
		this.domainLookup.table = this.parseTable;
		this.frameLookup['frame-method'] = this.parseFrameMethod;
		this.frameLookup['frame-header'] = this.parseFrameContentHeader;
		this.frameLookup['frame-body'] = this.parseFrameContentBody;
		this.frameLookup['frame-heartbeat'] = this.parseFrameHeartbeat;
		this.specData.amqp['class'].forEach(function(theClass) {
			self.classLookup[theClass.index] = theClass;
			theClass.method.forEach(function(method) {
				self.classLookup[theClass.index][method.index] = method;
			});
		});
		this.specData.amqp.domain.forEach(function(domain) {
			self.baseDomainLookup[domain.name] = domain.type;
			if (domain.assert) {
				self.domainAsserts[domain.name] = domain.assert;
			}
		});
		var processBaseDomain = function(domain) {
			if (self.baseDomainLookup[domain] === domain) {
				return domain;
			} else {
				return processBaseDomain(self.baseDomainLookup[domain]);
			}
		};
		for (var i in this.baseDomainLookup) {
			this.baseDomainLookup[i] = processBaseDomain(this.baseDomainLookup[i]);
		}
		this.specData.amqp.constant.forEach(function(constant) {
			self.constantLookup[constant.value] = constant;
		});
	}
	parseOctet(buffer) {
		var ret = buffer.readUInt8(buffer.read);
		buffer.read += 1;
		return ret;
	}
	parseSignedOctet(buffer) {
		var ret = buffer.readInt8(buffer.read);
		buffer.read += 1;
		return ret;
	}
	parseShort(buffer) {
		var ret = buffer.readUInt16BE(buffer.read);
		buffer.read += 2;
		return ret;
	}
	parseSignedShort(buffer) {
		var ret = buffer.readInt16BE(buffer.read);
		buffer.read += 2;
		return ret;
	}
	parseLong(buffer) {
		var ret = buffer.readUInt32BE(buffer.read);
		buffer.read += 4;
		return ret;
	}
	parseSignedLong(buffer) {
			var ret = buffer.readInt32BE(buffer.read);
			buffer.read += 4;
			return ret;
		}
		// this will fail for numbers greater than 2^53
	parseLongLong(buffer) {
			var ret = moreints.readUInt64BE(buffer, buffer.read);
			buffer.read += 8;
			return ret;
		}
		// this will fail for numbers greater than 2^53
	parseSignedLongLong(buffer) {
		var ret = moreints.readInt64BE(buffer, buffer.read);
		buffer.read += 8;
		return ret;
	}
	parseBoolean(buffer) {
		return this.parseOctet(buffer) > 0;
	}
	parseFloat(buffer) {
		var ret = buffer.readFloatBE(buffer.read);
		buffer.read += 4;
		return ret;
	}
	parseDouble(buffer) {
		var ret = buffer.readDoubleBE(buffer.read);
		buffer.read += 8;
		return ret;
	}
	parseBitPack(buffer, index) {
		var localIndex = index % 8;
		if (localIndex !== 0) {
			buffer.read--;
		}
		return this.parseOctet(buffer) & (1 << localIndex) ? true : false;
	}
	parseDecimal(buffer) {
		var decimalDigits = this.parseOctet(buffer);
		var data = this.parseSignedLong(buffer);
		return data / (Math.pow(10, decimalDigits));
	}
	parseTimestamp(buffer) {
		return new Date(this.parseSignedLongLong(buffer) * 1000);
	}
	parseShortString(buffer) {
		var length = this.parseOctet(buffer);
		var ret = buffer.toString('utf8', buffer.read, buffer.read + length);
		buffer.read += length;
		return ret;
	}
	parseLongString(buffer) {
		var length = this.parseLong(buffer);
		var ret = buffer.toString('utf8', buffer.read, buffer.read + length);
		buffer.read += length;
		return ret;
	}
	parseByteArray(buffer) {
		var length = this.parseLong(buffer);
		var end = buffer.read + length;
		var ret = buffer.slice(buffer.read, end);
		buffer.read += length;
		return ret;
	}
	parseVoid() {
		return;
	}
	parseArray(buffer) {
		var length = this.parseLong(buffer);
		var end = buffer.read + length;
		var ret = [];
		while (buffer.read < end) {
			ret.push(this.parseValue(buffer));
		}
		return ret;
	}
	parseTable(buffer) {
		var length = this.parseLong(buffer);
		var end = length + buffer.read;
		var ret = {};
		while (buffer.read < end) {
			ret[this.parseShortString(buffer)] = this.parseValue(buffer);
		}
		return ret;
	}
	parseValue(buffer) {
		return this.parseLookup[this.parseOctet(buffer)].call(this, buffer);
	}
	parseFields(buffer, fields) {
		var ret = {};
		var previousBitCount = 0;
		for (var i in fields) {
			var baseDomain = this.baseDomainLookup[fields[i].domain];
			if (!baseDomain) {
				baseDomain = fields[i].type;
			}
			var fieldEntry;
			if (baseDomain === 'bit') {
				fieldEntry = this.domainLookup[baseDomain].call(this, buffer, previousBitCount);
				previousBitCount += 1;
			} else {
				fieldEntry = this.domainLookup[baseDomain].call(this, buffer);
				previousBitCount = 0;
			}
			var assertions = (fields[i].assert || []).concat(this.domainAsserts[fields[i].domain] || []);
			for (var j in assertions) {
				checkAssertion(fieldEntry, assertions[j]);
			}
			if (!fields[i].reserved) {
				ret[fields[i].name] = fieldEntry;
			}
		}
		return ret;
	}
	parseFrameMethod(buffer) {
		// console.log('METHOD' + util.inspect(buffer));
		var classId = this.parseShort(buffer);
		var methodId = this.parseShort(buffer);
		var method = this.classLookup[classId][methodId];
		var fieldData = this.parseFields(buffer, method.field);
		var className = this.classLookup[classId].name;
		this.emit('method', this.frameChannel, className, method, fieldData);
	}
	parseFrameContentHeader(buffer) {
		// console.log('HEADER' + util.inspect(buffer));
		var classId = this.parseShort(buffer);
		/* var weight = RESERVED */
		this.parseShort(buffer);
		var bodySize = this.parseLongLong(buffer);
		var propertyFlags = [this.parseShort(buffer)];
		while (propertyFlags[propertyFlags.length - 1] & 0x0001) {
			propertyFlags.push(this.parseShort(buffer));
		}
		var theClass = this.classLookup[classId];
		var propertiesPresent = [];
		for (var propertyFlagsIndex in propertyFlags) {
			for (var maskIndex = 15; maskIndex > 0; maskIndex--) {
				var mask = 1 << maskIndex;
				propertiesPresent.push(propertyFlags[propertyFlagsIndex] & mask ? true : false);
			}
		}
		var bitFields = {};
		var fieldsPresent = [];
		for (var fieldIndex in theClass.field) {
			var field = theClass.field[fieldIndex];
			if (this.baseDomainLookup[field.domain] === 'bit') {
				bitFields[fieldIndex] = field;
			} else if (propertiesPresent[fieldIndex]) {
				fieldsPresent.push(field);
			}
		}
		var values = this.parseFields(buffer, fieldsPresent);
		var properties = {};
		for (var fieldsPresentIndex in fieldsPresent) {
			properties[fieldsPresent[fieldsPresentIndex].name] = values[fieldsPresent[fieldsPresentIndex].name];
		}
		for (var bitFieldsIndex in bitFields) {
			properties[bitFields[bitFieldsIndex].name] = propertiesPresent[bitFieldsIndex];
		}
		var className = this.classLookup[classId].name;
		this.emit('header', this.frameChannel, className, bodySize, properties);
	}
	parseFrameContentBody(buffer) {
		// console.log('BODY' + util.inspect(buffer));
		this.emit('body', this.frameChannel, buffer);
	}
	parseFrameHeartbeat(buffer) {
		this.emit('heartbeat');
	}
	resetFrameState() {
		this.frameStartBuffer = {
			'used': 0,
			'read': 0,
			'buffers': [],
		};
		this.framePayloadBuffer = undefined;
		this.frameEndBuffer = {
			'used': 0,
			'read': 0,
			'buffers': [],
		};
		this.frameType = 0;
		this.frameChannel = 0;
		this.frameSize = 0;
		this.currentFrameFunction = this.parseFrameStart;
	}
	parseFrameStart(buffer) {
		var dataRead = Math.min(this.frameStartSize - this.frameStartBuffer.used, buffer.length - buffer.read);
		this.frameStartBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.frameStartBuffer.used += dataRead;
		if (this.frameStartBuffer.used === this.frameStartSize) {
			var frameStartBuffer = Buffer.concat(this.frameStartBuffer.buffers);
			frameStartBuffer.used = this.frameStartBuffer.used;
			frameStartBuffer.read = this.frameStartBuffer.read;
			this.frameType = this.parseOctet(frameStartBuffer);
			this.frameChannel = this.parseShort(frameStartBuffer);
			this.framePayloadSize = this.parseLong(frameStartBuffer);
			this.framePayloadBuffer = {
				'used': 0,
				'read': 0,
				'buffers': [],
			};
			if (buffer.length === buffer.read) {
				return this.parseFramePayload;
			} else {
				return this.parseFramePayload(buffer);
			}
		} else {
			return this.parseFrameStart;
		}
	}
	parseFramePayload(buffer) {
		var dataRead = Math.min(this.framePayloadSize - this.framePayloadBuffer.used, buffer.length - buffer.read);
		this.framePayloadBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.framePayloadBuffer.used += dataRead;
		if (this.framePayloadBuffer.used === this.framePayloadSize) {
			if (buffer.length === buffer.read) {
				return this.parseFrameEnd;
			} else {
				return this.parseFrameEnd(buffer);
			}
		} else {
			return this.parseFramePayload;
		}
	}
	parseFrameEnd(buffer) {
		var dataRead = Math.min(this.frameEndSize - this.frameEndBuffer.used, buffer.length - buffer.read);
		this.frameEndBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.frameEndBuffer.used += dataRead;
		if (this.frameEndBuffer.used === this.frameEndSize) {
			var frameEndBuffer = Buffer.concat(this.frameEndBuffer.buffers);
			frameEndBuffer.used = this.frameEndBuffer.used;
			frameEndBuffer.read = this.frameEndBuffer.read;
			var endCheck = this.parseOctet(frameEndBuffer);
			if (!this.constantLookup[endCheck] || this.constantLookup[endCheck].name !== 'frame-end') {
				this.emit('error', new Error('frame end octet does not match the specification'));
			}
			try {
				var payloadBuffer = Buffer.concat(this.framePayloadBuffer.buffers);
				payloadBuffer.used = this.framePayloadBuffer.used;
				payloadBuffer.read = this.framePayloadBuffer.read;
				this.frameLookup[this.constantLookup[this.frameType].name].call(this, payloadBuffer);
			} finally {
				this.resetFrameState();
			}
			if (buffer.length === buffer.read) {
				return this.parseFrameStart;
			} else {
				return this.parseFrameStart(buffer);
			}
		} else {
			return this.parseFrameEnd;
		}
	}
	parse(data) {
		if (!(data instanceof Buffer)) {
			data = Buffer.from(data);
		}
		data.read = 0;
		try {
			this.currentFrameFunction = this.currentFrameFunction.call(this, data);
		} catch (parseError) {
			this.emit('error', parseError);
		}
	}
}
module.exports = FrameParser;
