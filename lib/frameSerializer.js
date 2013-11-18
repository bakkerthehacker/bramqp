/* jshint bitwise:false */

var util = require('util');
var events = require('events');

var FrameSerializer = module.exports = function FrameSerializer(spec) {
	var self = this;

	this.specData = spec;

	this.serializeLookup = {};
	this.domainLookup = {};
	this.baseDomainLookup = {};
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

	this.domainLookup.bit = this.serializeBitPack;
	this.domainLookup.octet = this.serializeOctet;
	this.domainLookup.short = this.serializeShort;
	this.domainLookup.long = this.serializeLong;
	this.domainLookup.longlong = this.serializeLongLong;
	this.domainLookup.shortstr = this.serializeShortString;
	this.domainLookup.longstr = this.serializeLongString;
	this.domainLookup.timestamp = this.serializeTimestamp;
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

	this.frameMax = parseInt(this.constantLookup['frame-min-size'].value, 10);
};

util.inherits(FrameSerializer, events.EventEmitter);

FrameSerializer.prototype.serializeOctet = function(buffer, octet) {
	if (octet !== undefined) {
		buffer.writeUInt8(octet, buffer.used);
		buffer.used += 1;
	} else {
		this.serializeOctet(buffer, 0);
	}
};

FrameSerializer.prototype.serializeSignedOctet = function(buffer, octet) {
	if (octet !== undefined) {
		buffer.writeInt8(octet, buffer.used);
		buffer.used += 1;
	} else {
		this.serializeSignedOctet(buffer, 0);
	}
};

FrameSerializer.prototype.serializeShort = function(buffer, short) {
	if (short !== undefined) {
		buffer.writeUInt16BE(short, buffer.used);
		buffer.used += 2;
	} else {
		this.serializeShort(buffer, 0);
	}
};

FrameSerializer.prototype.serializeSignedShort = function(buffer, short) {
	if (short !== undefined) {
		buffer.writeInt16BE(short, buffer.used);
		buffer.used += 2;
	} else {
		this.serializeSignedShort(buffer, 0);
	}
};

FrameSerializer.prototype.serializeLong = function(buffer, long) {
	if (long !== undefined) {
		buffer.writeUInt32BE(long, buffer.used);
		buffer.used += 4;
	} else {
		this.serializeLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeSignedLong = function(buffer, long) {
	if (long !== undefined) {
		buffer.writeInt32BE(long, buffer.used);
		buffer.used += 4;
	} else {
		this.serializeSignedLong(buffer, 0);
	}
};

// this will fail for numbers greater than 2^53
FrameSerializer.prototype.serializeLongLong = function(buffer, longLong) {
	if (longLong !== undefined) {
		var highLong = (longLong / ((1 << 30) * 4)) & (~0);
		var lowLong = longLong & (~0);
		this.serializeLong(buffer, highLong);
		this.serializeLong(buffer, lowLong);
	} else {
		this.serializeLongLong(buffer, 0);
	}
};

// this will fail for numbers greater than 2^53
FrameSerializer.prototype.serializeSignedLongLong = function(buffer, longLong) {
	if (longLong !== undefined) {
		if (longLong < 0) {
			var highLong = ((-longLong - 1) / ((1 << 30) * 4)) & (~0);
			var lowLong = (-longLong - 1) & (~0);
			this.serializeLong(buffer, ~highLong);
			this.serializeLong(buffer, ~lowLong);
		} else {
			var highLong = (longLong / ((1 << 30) * 4)) & (~0);
			var lowLong = longLong & (~0);
			this.serializeLong(buffer, highLong);
			this.serializeLong(buffer, lowLong);
		}
	} else {
		this.serializeSignedLongLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeBoolean = function(buffer, boolean) {
	this.serializeOctet(buffer, boolean ? 1 : 0);
};

FrameSerializer.prototype.serializeFloat = function(buffer, float) {
	if (float !== undefined) {
		buffer.writeFloatBE(float, buffer.used);
		buffer.used += 4;
	} else {
		this.serializeFloat(buffer, 0);
	}
};

FrameSerializer.prototype.serializeDouble = function(buffer, double) {
	if (double !== undefined) {
		buffer.writeDoubleBE(double, buffer.used);
		buffer.used += 8;
	} else {
		this.serializeDouble(buffer, 0);
	}
};

FrameSerializer.prototype.serializeBitPack = function(buffer, bit, previousBitCount) {
	var localIndex = previousBitCount % 8;
	if (localIndex === 0) {
		this.serializeOctet(buffer, 0);
	}

	buffer.writeUInt8(buffer.readUInt8(buffer.used - 1) | (bit ? (1 << localIndex) : 0), buffer.used - 1);
};

FrameSerializer.prototype.serializeDecimal = function(buffer, data) {
	if (data !== undefined) {
		this.serializeOctet(buffer, data.digits);
		this.serializeSignedLong(buffer, data.value * Math.pow(10, data.digits));
	} else {
		this.serializeDecimal(buffer, {
			digits : 0,
			value : 0
		});
	}
};

FrameSerializer.prototype.serializeTimestamp = function(buffer, timestamp) {
	this.serializeLongLong(buffer, timestamp);
};

FrameSerializer.prototype.serializeShortString = function(buffer, string) {
	if (typeof string === 'string') {
		var length = Buffer.byteLength(string);
		this.serializeOctet(buffer, length);
		buffer.write(string, buffer.used);
		buffer.used += length;
	} else {
		this.serializeOctet(buffer, 0);
	}
};

FrameSerializer.prototype.serializeByteArray = function(buffer, byteBuffer) {
	var length = byteBuffer.length;
	this.serializeLong(buffer, length);
	byteBuffer.copy(buffer, buffer.used);
	buffer.used += length;
};

FrameSerializer.prototype.serializeVoid = function() {
};

FrameSerializer.prototype.serializeArray = function(buffer, array) {
	this.serializeLong(buffer, array.length);
	for ( var i in array) {
		this.serializeValue(buffer, array[i]);
	}
};

FrameSerializer.prototype.serializeTable = function(buffer, table) {
	if (typeof table === 'object') {
		var lengthPosition = buffer.used;
		this.serializeLong(buffer, 0);
		var start = buffer.used;
		for ( var i in table) {
			this.serializeShortString(buffer, i);
			this.serializeValue(buffer, table[i]);
		}
		buffer.writeUInt32BE(buffer.used - start, lengthPosition);
	} else {
		this.serializeLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeLongString = function(buffer, string) {
	if (typeof string === 'string') {
		var length = Buffer.byteLength(string);
		this.serializeLong(buffer, length);
		buffer.write(string, buffer.used);
		buffer.used += length;
	} else if (typeof string === 'object') {
		this.serializeTable(buffer, string);
	} else {
		this.serializeLong(buffer, 0);
	}
};

FrameSerializer.prototype.serializeValue = function(buffer, value) {
	this.serializeOctet(buffer, this.specData.valueTypes[value.type]);
	this.serializeLookup[value.type](buffer, value.data);
};

FrameSerializer.prototype.serializeFields = function(buffer, fields, data) {
	var previousBitCount = 0;
	for ( var i in fields) {
		var baseDomain = this.baseDomainLookup[fields[i].domain];
		if (!baseDomain) {
			baseDomain = fields[i].type;
		}
		if (baseDomain === 'bit') {
			this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name], previousBitCount);
			previousBitCount += 1;
		} else {
			this.domainLookup[baseDomain].call(this, buffer, data[fields[i].name]);
			previousBitCount = 0;
		}
	}

};

FrameSerializer.prototype.serializeFrameStart = function(buffer, type, channel, payloadSize) {
	this.serializeOctet(buffer, type);
	this.serializeShort(buffer, channel);
	this.serializeLong(buffer, payloadSize);
};

FrameSerializer.prototype.serializeFramePayload = function(buffer, payloadBuffer) {
	payloadBuffer.copy(buffer, buffer.used, 0, payloadBuffer.used);
	buffer.used += payloadBuffer.used;
};

FrameSerializer.prototype.serializeFrameEnd = function(buffer) {
	this.serializeOctet(buffer, parseInt(this.constantLookup['frame-end'].value));
};

FrameSerializer.prototype.serializeFrameMethod = function(buffer, channel, className, methodName, fieldData) {
	var methodPayload = new Buffer(this.frameMax);
	methodPayload.used = 0;

	var theClass = this.classLookup[className];
	var method = this.classLookup[className][methodName];

	this.serializeShort(methodPayload, theClass.index);
	this.serializeShort(methodPayload, method.index);

	this.serializeFields(methodPayload, method.field, fieldData);

	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-method'].value, 10),
			theClass.handler === 'channel' ? channel : 0, methodPayload.used);
	this.serializeFramePayload(buffer, methodPayload);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameContentHeader = function(buffer, channel, className, bodySize, fieldData) {
	var headerPayload = new Buffer(this.frameMax);
	headerPayload.used = 0;

	var theClass = this.classLookup[className];

	this.serializeShort(headerPayload, theClass.index);
	this.serializeShort(headerPayload, 0);// weight - reserved
	this.serializeLongLong(headerPayload, bodySize);

	var fieldsPresent = [];
	var propertiesPresent = [];
	for ( var i in theClass.field) {
		var field = theClass.field[i];
		propertiesPresent.push(fieldData[field.name] ? true : false);
		if (fieldData[field.name]) {
			if (this.baseDomainLookup[field.domain] !== 'bit') {
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
		this.serializeShort(headerPayload, propertyFlags[i]);
	}

	this.serializeFields(headerPayload, fieldsPresent, fieldData);

	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-header'].value, 10),
			theClass.handler === 'channel' ? channel : 0, headerPayload.used);
	this.serializeFramePayload(buffer, headerPayload);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameContentBody = function(buffer, channel, bodyBuffer) {
	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-body'].value, 10), channel, bodyBuffer.used);
	this.serializeFramePayload(buffer, bodyBuffer);
	this.serializeFrameEnd(buffer);
};

FrameSerializer.prototype.serializeFrameHeartbeat = function(buffer) {
	this.serializeFrameStart(buffer, parseInt(this.constantLookup['frame-heartbeat'].value, 10), 0, 0);
	this.serializeFrameEnd(buffer);
};
