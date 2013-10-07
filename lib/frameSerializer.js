var util = require('util');
var async = require('async');
var events = require('events');

var serializeOctet = function(buffer, octet) {
	if (octet !== undefined) {
		buffer.writeUInt8(octet, buffer.used);
		buffer.used += 1;
	} else {
		serializeOctet(buffer, 0);
	}
};

var serializeSignedOctet = function(buffer, octet) {
	if (octet !== undefined) {
		buffer.writeInt8(octet, buffer.used);
		buffer.used += 1;
	} else {
		serializeSignedOctet(buffer, 0);
	}
};

var serializeShort = function(buffer, short) {
	if (short !== undefined) {
		buffer.writeUInt16BE(short, buffer.used);
		buffer.used += 2;
	} else {
		serializeShort(buffer, 0);
	}
};

var serializeSignedShort = function(buffer, short) {
	if (short !== undefined) {
		buffer.writeInt16BE(short, buffer.used);
		buffer.used += 2;
	} else {
		serializeSignedShort(buffer, 0);
	}
};

var serializeLong = function(buffer, long) {
	if (long !== undefined) {
		buffer.writeUInt32BE(long, buffer.used);
		buffer.used += 4;
	} else {
		serializeLong(buffer, 0);
	}
};

var serializeSignedLong = function(buffer, long) {
	if (long !== undefined) {
		buffer.writeInt32BE(long, buffer.used);
		buffer.used += 4;
	} else {
		serializeSignedLong(buffer, 0);
	}
};

// this will fail for numbers greater than 2^53
var serializeLongLong = function(buffer, longLong) {
	if (longLong !== undefined) {
		var highLong = (longLong / ((1 << 30) * 4)) & (~0);
		var lowLong = longLong & (~0);
		serializeLong(buffer, highLong);
		serializeLong(buffer, lowLong);
	} else {
		serializeLongLong(buffer, 0);
	}
};

// this will fail for numbers greater than 2^53
var serializeSignedLongLong = function(buffer, longLong) {
	if (longLong !== undefined) {
		if (longLong < 0) {
			var highLong = ((-longLong - 1) / ((1 << 30) * 4)) & (~0);
			var lowLong = (-longLong - 1) & (~0);
			serializeLong(buffer, ~highLong);
			serializeLong(buffer, ~lowLong);
		} else {
			var highLong = (longLong / ((1 << 30) * 4)) & (~0);
			var lowLong = longLong & (~0);
			serializeLong(buffer, highLong);
			serializeLong(buffer, lowLong);
		}
	} else {
		serializeSignedLongLong(buffer, 0);
	}
};

var serializeBoolean = function(buffer, boolean) {
	serializeOctet(buffer, boolean ? 1 : 0);
};

var serializeFloat = function(buffer, float) {
	buffer.writeFloatBE(float, buffer.used);
	buffer.used += 4;
};

var serializeDouble = function(buffer, double) {
	buffer.writeDoubleBE(double, buffer.used);
	buffer.used += 8;
};

var serializeBitPack = function(buffer, bit, previousBitCount) {
	var localIndex = previousBitCount % 8;
	if (localIndex === 0) {
		serializeOctet(buffer, 0);
	}

	buffer.writeUInt8(buffer.readUInt8(buffer.used - 1) | (bit ? (1 << localIndex) : 0), buffer.used - 1);
};

var serializeDecimal = function(buffer, data) {
	serializeOctet(buffer, data.digits);
	serializeLong(buffer, data.value * Math.Pow(10, data.digits));
};

var serializeTimestamp = function(buffer, timestamp) {
	serializeLongLong(buffer, timestamp);
};

var serializeShortString = function(buffer, string) {
	if (typeof string === 'string') {
		var length = Buffer.byteLength(string);
		serializeOctet(buffer, length);
		buffer.write(string, buffer.used);
		buffer.used += length;
	} else {
		serializeOctet(buffer, 0);
	}
};

var serializeByteArray = function(buffer, byteBuffer) {
	var length = byteBuffer.length;
	serializeLong(buffer, length);
	byteBuffer.copy(buffer, buffer.used);
	buffer.used += length;
};

var serializeVoid = function(buffer) {
};

var FrameSerializer = module.exports = function FrameSerializer(spec) {
	var self = this;

	this.specData = spec;

	this.serializeLookup = {};
	this.domainLookup = {};
	this.baseDomainLookup = {};
	this.constantLookup = {};
	this.classLookup = {};

	this.serializeLookup['Boolean'] = serializeBoolean;
	this.serializeLookup['Signed 8-bit'] = serializeSignedOctet;
	this.serializeLookup['Unsigned 8-bit'] = serializeOctet;
	this.serializeLookup['Signed 16-bit'] = serializeSignedShort;
	this.serializeLookup['Unsigned 16-bit'] = serializeShort;
	this.serializeLookup['Signed 32-bit'] = serializeSignedLong;
	this.serializeLookup['Unsigned 32-bit'] = serializeLong;
	this.serializeLookup['Signed 64-bit'] = serializeSignedLongLong;
	this.serializeLookup['Unsigned 64-bit'] = serializeLongLong;
	this.serializeLookup['32-bit float'] = serializeFloat;
	this.serializeLookup['64-bit float'] = serializeDouble;
	this.serializeLookup['Decimal'] = serializeDecimal;
	this.serializeLookup['Short string'] = serializeShortString;
	this.serializeLookup['Long string'] = this.serializeLongString;
	this.serializeLookup['Array'] = this.serializeArray;
	this.serializeLookup['Timestamp'] = serializeTimestamp;
	this.serializeLookup['Nested Table'] = this.serializeTable;
	this.serializeLookup['Void'] = serializeVoid;
	this.serializeLookup['Byte array'] = serializeByteArray;

	this.domainLookup.bit = serializeBitPack;
	this.domainLookup.octet = serializeOctet;
	this.domainLookup.short = serializeShort;
	this.domainLookup.long = serializeLong;
	this.domainLookup.longlong = serializeLongLong;
	this.domainLookup.shortstr = serializeShortString;
	this.domainLookup.longstr = this.serializeLongString;
	this.domainLookup.timestamp = serializeTimestamp;
	this.domainLookup.table = this.serializeTable;

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
		self.constantLookup[constant.name] = constant;
	});

	this.specData.amqp['class'].forEach(function(theClass) {
		self.classLookup[theClass.name] = theClass;
		theClass.method.forEach(function(method) {
			self.classLookup[theClass.name][method.name] = method;
		});
	});

	this.frameMax = parseInt(this.constantLookup['frame-min-size'].value);
};

util.inherits(FrameSerializer, events.EventEmitter);

FrameSerializer.prototype.serializeArray = function(buffer, array) {
	serializeLong(buffer, array.length);
	for ( var i in array) {
		this.serializeValue(buffer, array[i]);
	}
};

FrameSerializer.prototype.serializeTable = function(buffer, table) {
	if (typeof table === 'object') {
		var lengthPosition = buffer.used;
		serializeLong(buffer, 0);
		var start = buffer.used;
		for ( var i in table) {
			serializeShortString(buffer, i);
			this.serializeValue(buffer, table[i]);
		}
		buffer.writeUInt32BE(buffer.used - start, lengthPosition);
	} else {
		serializeLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeLongString = function(buffer, string) {
	if (typeof string === 'string') {
		var length = Buffer.byteLength(string);
		serializeLong(buffer, length);
		buffer.write(string, buffer.used);
		buffer.used += length;
	} else if (typeof string === 'object') {
		this.serializeTable(buffer, string);
	} else {
		serializeLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeValue = function(buffer, value) {
	serializeOctet(buffer, this.specData.valueTypes[value.type]);
	this.serializeLookup[value.type](buffer, value.data);
};

FrameSerializer.prototype.serializeFields = function(buffer, fields, data) {
	var previousBitCount = 0;
	for ( var i in fields) {
		var baseDomain = this.baseDomainLookup[fields[i].domain];
		if (!baseDomain) {
			baseDomain = fields[i].type;
		}
		if (baseDomain == 'bit') {
			this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name], previousBitCount);
			previousBitCount += 1;
		} else {
			this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name]);
			previousBitCount = 0;
		}
	}

};

FrameSerializer.prototype.serializeFrameStart = function(buffer, type, channel, payloadSize) {
	serializeOctet(buffer, type);
	serializeShort(buffer, channel);
	serializeLong(buffer, payloadSize);
};

FrameSerializer.prototype.serializeFramePayload = function(buffer, payloadBuffer) {
	payloadBuffer.copy(buffer, buffer.used, 0, payloadBuffer.used);
	buffer.used += payloadBuffer.used;
};

FrameSerializer.prototype.serializeFrameEnd = function(buffer) {
	serializeOctet(buffer, parseInt(this.constantLookup['frame-end'].value));
};

FrameSerializer.prototype.serializeFrameMethod = function(buffer, channel, className, methodName, fieldData) {
	var methodPayload = new Buffer(this.frameMax);
	methodPayload.used = 0;

	var theClass = this.classLookup[className];
	var method = this.classLookup[className][methodName];

	serializeShort(methodPayload, theClass.index);
	serializeShort(methodPayload, method.index);

	this.serializeFields(methodPayload, method.field, fieldData);

	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-method'].value),
			theClass.handler === 'channel' ? channel : 0, methodPayload.used);
	this.serializeFramePayload(buffer, methodPayload);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameContentHeader = function(buffer, channel, className, bodySize, fieldData) {
	var headerPayload = new Buffer(this.frameMax);
	headerPayload.used = 0;

	var theClass = this.classLookup[className];

	serializeShort(headerPayload, theClass.index);
	serializeShort(headerPayload, 0);// weight - reserved
	serializeLongLong(headerPayload, bodySize);

	var fieldsPresent = [];
	var propertiesPresent = [];
	for ( var i in theClass.field) {
		var field = theClass.field[i];
		propertiesPresent.push(fieldData[field.name] ? true : false);
		if (fieldData[field.name]) {
			if (this.baseDomainLookup[field.domain] != 'bit') {
				fieldsPresent.push(field);
			}
		}
	}

	var propertyFlags = [];

	for ( var i in propertiesPresent) {
		var localIndex = i % 15;
		var propertyIndex = i / 15;
		if (localIndex === 0) {
			propertyFlags[propertyIndex] = 0;
			if (propertyIndex !== 0) {
				propertyFlags[propertyIndex - 1] |= 1;
			}
		}
		if (propertiesPresent[i]) {
			propertyFlags[propertyIndex] |= 1 << (15 - localIndex);
		}
	}

	if (!propertyFlags.length) {
		propertyFlags.push(0);
	}

	for ( var i in propertyFlags) {
		serializeShort(headerPayload, propertyFlags[i]);
	}

	this.serializeFields(headerPayload, fieldsPresent, fieldData);

	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-header'].value),
			theClass.handler === 'channel' ? channel : 0, headerPayload.used);
	this.serializeFramePayload(buffer, headerPayload);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameContentBody = function(buffer, channel, bodyBuffer) {
	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-body'].value), channel, bodyBuffer.used);
	this.serializeFramePayload(buffer, bodyBuffer);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameHeartbeat = function(buffer) {
	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-heartbeat'].value), 0, 0);
	this.serializeFrameEnd(buffer);
};
