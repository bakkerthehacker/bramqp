var valueTypes = {
	'rabbitmq/full/amqp0-9-1.stripped.extended' : {
		'Boolean' : 116,// t
		'Signed 8-bit' : 98,// b
		// 'Unsigned 8-bit':,//
		'Signed 16-bit' : 115,// s
		// 'Unsigned 16-bit':,//
		'Signed 32-bit' : 73,// I
		// 'Unsigned 32-bit':,//
		'Signed 64-bit' : 108,// l
		// 'Unsigned 64-bit':,//
		'32-bit float' : 102,// f
		'64-bit float' : 100,// d
		'Decimal' : 68,// D
		// 'Short string':,//
		'Long string' : 83,// S
		'Array' : 65,// A
		'Timestamp' : 84,// T
		'Nested Table' : 70,// F
		'Void' : 86,// V
		'Byte array' : 120,// x
	}
};

module.exports = valueTypes;