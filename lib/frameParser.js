var util = require('util');
var async = require('async');
var events = require('events');

var parseOctet = function(buffer) {
	var ret = buffer.readUInt8(buffer.read);
	buffer.read += 1;
	return ret;
};

var parseSignedOctet = function(buffer) {
	var ret = buffer.readInt8(buffer.read);
	buffer.read += 1;
	return ret;
};

var parseShort = function(buffer) {
	var ret = buffer.readUInt16BE(buffer.read);
	buffer.read += 2;
	return ret;
};

var parseSignedShort = function(buffer) {
	var ret = buffer.readInt16BE(buffer.read);
	buffer.read += 2;
	return ret;
};

var parseLong = function(buffer) {
	var ret = buffer.readUInt32BE(buffer.read);
	buffer.read += 4;
	return ret;
};

var parseSignedLong = function(buffer) {
	var ret = buffer.readInt32BE(buffer.read);
	buffer.read += 4;
	return ret;
};

// this will fail for numbers greater than 2^53
var parseLongLong = function(buffer) {
	return (parseLong(buffer) * ((1 << 30) * 4)) + parseLong(buffer);
};

// this will fail for numbers greater than 2^53
var parseSignedLongLong = function(buffer) {
	var highLong = parseLong(buffer);
	var lowLong = parseLong(buffer);

	if (highLong & 0x80000000) {
		return -(((~highLong) * ((1 << 30) * 4)) + (~lowLong) + 1);
	} else {
		return (highLong * ((1 << 30) * 4)) + lowLong;
	}
};

var parseBoolean = function(buffer) {
	return parseOctet(buffer) > 0;
};

var parseFloat = function(buffer) {
	var ret = buffer.readFloatBE(buffer.read);
	buffer.read += 4;
	return ret;
};

var parseDouble = function(buffer) {
	var ret = buffer.readDoubleBE(buffer.read);
	buffer.read += 8;
	return ret;
};

var parseBitPack = function(buffer, index) {
	var localIndex = index % 8;
	if (localIndex !== 0) {
		buffer.read--;
	}
	return parseOctet(buffer) & (1 << localIndex) ? true : false;
};

var parseDecimal = function(buffer) {
	var decimalDigits = parseOctet(buffer);
	var data = parseLong(buffer);
	return data / (Math.Pow(10, decimalDigits));
};

var parseTimestamp = function(buffer) {
	return new Date(parseLongLong(buffer) * 1000);
};

var parseShortString = function(buffer) {
	var length = parseOctet(buffer);
	var ret = buffer.toString('utf8', buffer.read, buffer.read + length);
	buffer.read += length;
	return ret;
};

var parseLongString = function(buffer) {
	var length = parseLong(buffer);
	var ret = buffer.toString('utf8', buffer.read, buffer.read + length);
	buffer.read += length;
	return ret;
};

var parseByteArray = function(buffer) {
	var length = parseLong(buffer);
	var end = buffer.read + length;
	var ret = new Buffer(length);

	buffer.copy(ret, 0, buffer.read, end);
	buffer.read += len;

	return ret;
};

var parseVoid = function(buffer) {
	return;
};

var FrameParser = module.exports = function FrameParser(spec) {
	var self = this;

	this.specData = spec;

	this.parseLookup = {};
	this.domainLookup = {};
	this.frameLookup = {};
	this.classLookup = {};
	this.baseDomainLookup = {};
	this.constantLookup = {};

	this.frameStartSize = 7;
	this.frameEndSize = 1;

	this.frameStartBuffer;
	this.framePayloadBuffer;
	this.frameEndBuffer;

	this.frameType;
	this.frameChannel;
	this.framePayloadSize;

	this.resetFrameState();

	this.currentFrameFunction = this.parseFrameStart;

	this.parseLookup[this.specData.valueTypes['Boolean']] = parseBoolean;
	this.parseLookup[this.specData.valueTypes['Signed 8-bit']] = parseSignedOctet;
	this.parseLookup[this.specData.valueTypes['Unsigned 8-bit']] = parseOctet;
	this.parseLookup[this.specData.valueTypes['Signed 16-bit']] = parseSignedShort;
	this.parseLookup[this.specData.valueTypes['Unsigned 16-bit']] = parseShort;
	this.parseLookup[this.specData.valueTypes['Signed 32-bit']] = parseSignedLong;
	this.parseLookup[this.specData.valueTypes['Unsigned 32-bit']] = parseLong;
	this.parseLookup[this.specData.valueTypes['Signed 64-bit']] = parseSignedLongLong;
	this.parseLookup[this.specData.valueTypes['Unsigned 64-bit']] = parseLongLong;
	this.parseLookup[this.specData.valueTypes['32-bit float']] = parseFloat;
	this.parseLookup[this.specData.valueTypes['64-bit float']] = parseDouble;
	this.parseLookup[this.specData.valueTypes['Decimal']] = parseDecimal;
	this.parseLookup[this.specData.valueTypes['Short string']] = parseShortString;
	this.parseLookup[this.specData.valueTypes['Long string']] = parseLongString;
	this.parseLookup[this.specData.valueTypes['Array']] = this.parseArray;
	this.parseLookup[this.specData.valueTypes['Timestamp']] = parseTimestamp;
	this.parseLookup[this.specData.valueTypes['Nested Table']] = this.parseTable;
	this.parseLookup[this.specData.valueTypes['Void']] = parseVoid;
	this.parseLookup[this.specData.valueTypes['Byte array']] = parseByteArray;

	this.domainLookup.bit = parseBitPack;
	this.domainLookup.octet = parseOctet;
	this.domainLookup.short = parseShort;
	this.domainLookup.long = parseLong;
	this.domainLookup.longlong = parseLongLong;
	this.domainLookup.shortstr = parseShortString;
	this.domainLookup.longstr = parseLongString;
	this.domainLookup.timestamp = parseTimestamp;
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
	});
	var processBaseDomain = function(domain) {
		if (self.baseDomainLookup[domain] === domain) {
			return domain;
		} else {
			return processBaseDomain(self.baseDomainLookup[domain]);
		}
	};
	for ( var i in this.baseDomainLookup) {
		this.baseDomainLookup[i] = processBaseDomain(this.baseDomainLookup[i]);
	}

	this.specData.amqp.constant.forEach(function(constant) {
		self.constantLookup[constant.value] = constant;
	});
};

util.inherits(FrameParser, events.EventEmitter);

FrameParser.prototype.parseArray = function(buffer) {
	var length = parseLong(buffer);
	var end = buffer.read + length;
	var ret = [];

	while (buffer.read < end) {
		ret.push(this.parseValue(buffer));
	}

	return ret;
};

FrameParser.prototype.parseTable = function(buffer) {
	var length = parseLong(buffer);
	var end = length + buffer.read;
	var ret = {};

	while (buffer.read < end) {
		ret[parseShortString(buffer)] = this.parseValue(buffer);
	}

	return ret;
};

FrameParser.prototype.parseValue = function(buffer) {
	return this.parseLookup[parseOctet(buffer)].call(this, buffer);
};

FrameParser.prototype.parseFields = function(buffer, fields) {
	var ret = {};
	var previousBitCount = 0;
	for ( var i in fields) {
		var baseDomain = this.baseDomainLookup[fields[i].domain];
		if (!baseDomain) {
			baseDomain = fields[i].type;
		}
		var fieldEntry;
		if (baseDomain == 'bit') {
			fieldEntry = this.domainLookup[baseDomain].call(this, buffer, previousBitCount);
			previousBitCount += 1;
		} else {
			fieldEntry = this.domainLookup[baseDomain].call(this, buffer);
			previousBitCount = 0;
		}
		if (!fields[i].reserved) {
			ret[fields[i].name] = fieldEntry;
		}
	}

	return ret;
};

FrameParser.prototype.parseFrameMethod = function(buffer) {
	// console.log('METHOD' + util.inspect(buffer));

	var classId = parseShort(buffer);
	var methodId = parseShort(buffer);
	var method = this.classLookup[classId][methodId];

	var fieldData = this.parseFields(buffer, method.field);

	var className = this.classLookup[classId].name;

	this.emit('method', this.frameChannel, className, method, fieldData);

};

FrameParser.prototype.parseFrameContentHeader = function(buffer) {
	// console.log('HEADER' + util.inspect(buffer));

	var classId = parseShort(buffer);
	var weight = parseShort(buffer);
	var bodySize = parseLongLong(buffer);
	var propertyFlags = [ parseShort(buffer) ];

	while (propertyFlags[propertyFlags.length - 1] & 0x0001) {
		propertyFlags.push(parseShort(buffer));
	}

	var theClass = this.classLookup[classId];

	var propertiesPresent = [];
	for ( var i in propertyFlags) {
		for ( var j = 15; j > 0; j--) {
			var mask = 1 << j;
			propertiesPresent.push(propertyFlags[i] & mask ? true : false);
		}
	}

	var bitFields = {};
	var fieldsPresent = [];
	for ( var i in theClass.field) {
		var field = theClass.field[i];
		if (this.baseDomainLookup[field.domain] == 'bit') {
			bitFields[i] = field;
		} else if (propertiesPresent[i]) {
			fieldsPresent.push(field);
		}
	}

	var values = this.parseFields(buffer, fieldsPresent);

	var properties = {};
	for ( var i in fieldsPresent) {
		properties[fieldsPresent[i].name] = values[fieldsPresent[i].name];
	}
	for ( var i in bitFields) {
		properties[bitFields[i].name] = propertiesPresent[i];
	}

	var className = this.classLookup[classId].name;

	this.emit('header', this.frameChannel, className, bodySize, properties);
};

FrameParser.prototype.parseFrameContentBody = function(buffer) {
	// console.log('BODY' + util.inspect(buffer));
	this.emit('body', this.frameChannel, buffer);
};

FrameParser.prototype.parseFrameHeartbeat = function(buffer) {
	this.emit('heartbeat');
};

FrameParser.prototype.resetFrameState = function() {
	this.frameStartBuffer = new Buffer(this.frameStartSize);
	this.frameStartBuffer.used = 0;
	this.frameStartBuffer.read = 0;

	this.framePayloadBuffer = undefined;

	this.frameEndBuffer = new Buffer(this.frameEndSize);
	this.frameEndBuffer.used = 0;
	this.frameEndBuffer.read = 0;

	this.frameType = 0;
	this.frameChannel = 0; // TODO implement channels
	this.frameSize = 0;

	this.currentFrameFunction = this.parseFrameStart;
};

FrameParser.prototype.parseFrameStart = function(buffer) {

	var dataRead = Math.min(this.frameStartSize - this.frameStartBuffer.used, buffer.length - buffer.read);
	buffer.copy(this.frameStartBuffer, this.frameStartBuffer.used, buffer.read, buffer.read + dataRead);
	buffer.read += dataRead;
	this.frameStartBuffer.used += dataRead;

	if (this.frameStartBuffer.used === this.frameStartSize) {
		this.frameType = parseOctet(this.frameStartBuffer);
		this.frameChannel = parseShort(this.frameStartBuffer);
		this.framePayloadSize = parseLong(this.frameStartBuffer);

		this.framePayloadBuffer = new Buffer(this.framePayloadSize);
		this.framePayloadBuffer.used = 0;
		this.framePayloadBuffer.read = 0;

		if (buffer.length === buffer.read) {
			return this.parseFramePayload;
		} else {
			return this.parseFramePayload(buffer);
		}
	} else {
		return this.parseFrameStart;
	}
};

FrameParser.prototype.parseFramePayload = function(buffer) {

	var dataRead = Math.min(this.framePayloadSize - this.framePayloadBuffer.used, buffer.length - buffer.read);
	buffer.copy(this.framePayloadBuffer, this.framePayloadBuffer.used, buffer.read, buffer.read + dataRead);
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
};

FrameParser.prototype.parseFrameEnd = function(buffer) {

	var dataRead = Math.min(this.frameEndSize - this.frameEndBuffer.used, buffer.length - buffer.read);
	buffer.copy(this.frameEndBuffer, this.frameEndBuffer.used, buffer.read, buffer.read + dataRead);
	buffer.read += dataRead;
	this.frameEndBuffer.used += dataRead;

	if (this.frameEndBuffer.used === this.frameEndSize) {

		var endCheck = parseOctet(this.frameEndBuffer);

		if (!this.constantLookup[endCheck] || this.constantLookup[endCheck].name !== 'frame-end') {
			throw new Error('frame end octet does not match the specification');
		}

		this.frameLookup[this.constantLookup[this.frameType].name].call(this, this.framePayloadBuffer);

		this.resetFrameState();

		if (buffer.length === buffer.read) {
			return this.parseFrameStart;
		} else {
			return this.parseFrameStart(buffer);
		}
	} else {
		return this.parseFrameEnd;
	}
};

FrameParser.prototype.parse = function(data) {
	data.read = 0;
	try {
		this.currentFrameFunction = this.currentFrameFunction.call(this, data);
	} catch (parseError) {
		this.emit('error', parseError);
		throw parseError;
	}
};
