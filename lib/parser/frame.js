'use strict';
const { EventEmitter, once } = require('events');
const { Transform } = require('stream');
const moreints = require('buffer-more-ints');
const { checkAssertion } = require('../spec/assertion');
class FrameParser extends Transform {
	constructor(spec) {
		super({
			readableObjectMode: true
		});
		this.specData = spec;
		this.parsedFrames = {};
		this.parseLookup = {};
		this.domainLookup = {};
		this.frameLookup = {};
		this.classLookup = this.specData.classes;
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
		for (let theClass of this.specData.amqp['class']) {
			this.classLookup[theClass.index] = theClass;
			for (let method of theClass.method) {
				this.classLookup[theClass.index][method.index] = method;
			}
		}
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
			this.constantLookup[constant.value] = constant;
		}
	}
	parseOctet(buffer) {
		const ret = buffer.readUInt8(buffer.read);
		buffer.read += 1;
		return ret;
	}
	parseSignedOctet(buffer) {
		const ret = buffer.readInt8(buffer.read);
		buffer.read += 1;
		return ret;
	}
	parseShort(buffer) {
		const ret = buffer.readUInt16BE(buffer.read);
		buffer.read += 2;
		return ret;
	}
	parseSignedShort(buffer) {
		const ret = buffer.readInt16BE(buffer.read);
		buffer.read += 2;
		return ret;
	}
	parseLong(buffer) {
		const ret = buffer.readUInt32BE(buffer.read);
		buffer.read += 4;
		return ret;
	}
	parseSignedLong(buffer) {
			const ret = buffer.readInt32BE(buffer.read);
			buffer.read += 4;
			return ret;
		}
		// this will fail for numbers greater than 2^53
	parseLongLong(buffer) {
			const ret = moreints.readUInt64BE(buffer, buffer.read);
			buffer.read += 8;
			return ret;
		}
		// this will fail for numbers greater than 2^53
	parseSignedLongLong(buffer) {
		const ret = moreints.readInt64BE(buffer, buffer.read);
		buffer.read += 8;
		return ret;
	}
	parseBoolean(buffer) {
		return this.parseOctet(buffer) > 0;
	}
	parseFloat(buffer) {
		const ret = buffer.readFloatBE(buffer.read);
		buffer.read += 4;
		return ret;
	}
	parseDouble(buffer) {
		const ret = buffer.readDoubleBE(buffer.read);
		buffer.read += 8;
		return ret;
	}
	parseBitPack(buffer, index) {
		const localIndex = index % 8;
		if (localIndex !== 0) {
			buffer.read--;
		}
		return this.parseOctet(buffer) & (1 << localIndex) ? true : false;
	}
	parseDecimal(buffer) {
		const decimalDigits = this.parseOctet(buffer);
		const data = this.parseSignedLong(buffer);
		return data / (Math.pow(10, decimalDigits));
	}
	parseTimestamp(buffer) {
		return new Date(this.parseSignedLongLong(buffer) * 1000);
	}
	parseShortString(buffer) {
		const length = this.parseOctet(buffer);
		const ret = buffer.toString('utf8', buffer.read, buffer.read + length);
		buffer.read += length;
		return ret;
	}
	parseLongString(buffer) {
		const length = this.parseLong(buffer);
		const ret = buffer.toString('utf8', buffer.read, buffer.read + length);
		buffer.read += length;
		return ret;
	}
	parseByteArray(buffer) {
		const length = this.parseLong(buffer);
		const end = buffer.read + length;
		const ret = buffer.slice(buffer.read, end);
		buffer.read += length;
		return ret;
	}
	parseVoid() {
		return;
	}
	parseArray(buffer) {
		const length = this.parseLong(buffer);
		const end = buffer.read + length;
		const ret = [];
		while (buffer.read < end) {
			ret.push(this.parseValue(buffer));
		}
		return ret;
	}
	parseTable(buffer) {
		const length = this.parseLong(buffer);
		const end = length + buffer.read;
		const ret = {};
		while (buffer.read < end) {
			ret[this.parseShortString(buffer)] = this.parseValue(buffer);
		}
		return ret;
	}
	parseValue(buffer) {
		return this.parseLookup[this.parseOctet(buffer)].call(this, buffer);
	}
	parseFields(buffer, fields, className, methodName) {
		let ret = {};
		let previousBitCount = 0;
		for (let field of fields) {
			let baseDomain = this.baseDomainLookup[field.domain];
			if (!baseDomain) {
				baseDomain = field.type;
			}
			let fieldEntry;
			if (baseDomain === 'bit') {
				fieldEntry = this.domainLookup[baseDomain].call(this, buffer, previousBitCount);
				previousBitCount += 1;
			} else {
				fieldEntry = this.domainLookup[baseDomain].call(this, buffer);
				previousBitCount = 0;
			}
			let assertions = (field.assert || []).concat(this.domainAsserts[field.domain] || []);
			for (let i in assertions) {
				checkAssertion(fieldEntry, assertions[i], field, className, methodName);
			}
			if (!field.reserved) {
				ret[field.name] = fieldEntry;
			}
		}
		return ret;
	}
	parseFrameMethod(buffer) {
		const classId = this.parseShort(buffer);
		const methodId = this.parseShort(buffer);
		const method = this.classLookup[classId][methodId];
		const className = this.classLookup[classId].name;
		const data = this.parseFields(buffer, method.field, className, method.name);
		// TODO merge method+content and add reply
		this.push({
			frame: 'method',
			channel: this.frameChannel,
			className,
			methodName: method.name,
			method,
			data
		});
	}
	parseFrameContentHeader(buffer) {
		const classId = this.parseShort(buffer);
		/* const weight = RESERVED */
		this.parseShort(buffer);
		const size = this.parseLongLong(buffer);
		const propertyFlags = [this.parseShort(buffer)];
		while (propertyFlags[propertyFlags.length - 1] & 0x0001) {
			propertyFlags.push(this.parseShort(buffer));
		}
		const theClass = this.classLookup[classId];
		const propertiesPresent = [];
		for (let propertyFlagsIndex in propertyFlags) {
			for (let maskIndex = 15; maskIndex > 0; maskIndex--) {
				const mask = 1 << maskIndex;
				propertiesPresent.push(propertyFlags[propertyFlagsIndex] & mask ? true : false);
			}
		}
		const bitFields = {};
		const fieldsPresent = [];
		for (let fieldIndex in theClass.field) {
			const field = theClass.field[fieldIndex];
			if (this.baseDomainLookup[field.domain] === 'bit') {
				bitFields[fieldIndex] = field;
			} else if (propertiesPresent[fieldIndex]) {
				fieldsPresent.push(field);
			}
		}
		const className = this.classLookup[classId].name;
		const values = this.parseFields(buffer, fieldsPresent, className, 'content');
		const properties = {};
		for (let fieldsPresentIndex in fieldsPresent) {
			properties[fieldsPresent[fieldsPresentIndex].name] = values[fieldsPresent[fieldsPresentIndex].name];
		}
		for (let bitFieldsIndex in bitFields) {
			properties[bitFields[bitFieldsIndex].name] = propertiesPresent[bitFieldsIndex];
		}
		this.push({
			frame: 'header',
			channel: this.frameChannel,
			className,
			size,
			properties
		});
	}
	parseFrameContentBody(body) {
		this.push({
			frame: 'body',
			channel: this.frameChannel,
			body
		});
	}
	parseFrameHeartbeat(buffer) {
		this.push({
			frame: 'heartbeat'
		});
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
		const dataRead = Math.min(this.frameStartSize - this.frameStartBuffer.used, buffer.length - buffer.read);
		this.frameStartBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.frameStartBuffer.used += dataRead;
		if (this.frameStartBuffer.used === this.frameStartSize) {
			const frameStartBuffer = Buffer.concat(this.frameStartBuffer.buffers);
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
			return this.parseFramePayload;
		} else {
			return this.parseFrameStart;
		}
	}
	parseFramePayload(buffer) {
		const dataRead = Math.min(this.framePayloadSize - this.framePayloadBuffer.used, buffer.length - buffer.read);
		this.framePayloadBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.framePayloadBuffer.used += dataRead;
		if (this.framePayloadBuffer.used === this.framePayloadSize) {
			return this.parseFrameEnd;
		} else {
			return this.parseFramePayload;
		}
	}
	parseFrameEnd(buffer) {
		const dataRead = Math.min(this.frameEndSize - this.frameEndBuffer.used, buffer.length - buffer.read);
		this.frameEndBuffer.buffers.push(buffer.slice(buffer.read, buffer.read + dataRead));
		buffer.read += dataRead;
		this.frameEndBuffer.used += dataRead;
		if (this.frameEndBuffer.used === this.frameEndSize) {
			const frameEndBuffer = Buffer.concat(this.frameEndBuffer.buffers);
			frameEndBuffer.used = this.frameEndBuffer.used;
			frameEndBuffer.read = this.frameEndBuffer.read;
			const endCheck = this.parseOctet(frameEndBuffer);
			if (!this.constantLookup[endCheck] || this.constantLookup[endCheck].name !== 'frame-end') {
				throw new Error('frame end octet does not match the specification');
			}
			try {
				const payloadBuffer = Buffer.concat(this.framePayloadBuffer.buffers);
				payloadBuffer.used = this.framePayloadBuffer.used;
				payloadBuffer.read = this.framePayloadBuffer.read;
				this.frameLookup[this.constantLookup[this.frameType].name].call(this, payloadBuffer);
			} finally {
				this.resetFrameState();
			}
			return this.parseFrameStart;
		} else {
			return this.parseFrameEnd;
		}
	}
	_transform(data, encoding, callback) {
		if (!(data instanceof Buffer)) {
			data = Buffer.from(data, encoding);
		}
		data.read = 0;
		while (data.read !== data.length) {
			this.currentFrameFunction = this.currentFrameFunction.call(this, data);
		}
		callback();
	}
}
Object.assign(module.exports, { FrameParser });
