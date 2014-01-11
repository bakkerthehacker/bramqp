var valueTypes = {
	'rabbitmq/full/amqp0-8.stripped' : {
		'Boolean' : 0x74,// t
		'Signed 8-bit' : 0x62,// b
		// 'Unsigned 8-bit':,//
		'Signed 16-bit' : 0x73,// s
		// 'Unsigned 16-bit':,//
		'Signed 32-bit' : 0x49,// I
		// 'Unsigned 32-bit':,//
		'Signed 64-bit' : 0x6c,// l
		// 'Unsigned 64-bit':,//
		'32-bit float' : 0x66,// f
		'64-bit float' : 0x64,// d
		'Decimal' : 0x44,// D
		// 'Short string':,//
		'Long string' : 0x53,// S
		'Array' : 0x41,// A
		'Timestamp' : 0x54,// T
		'Nested Table' : 0x46,// F
		'Void' : 0x56,// V
		'Byte array' : 0x78,// x
	},
	'rabbitmq/full/amqp0-9.stripped' : {
		'Boolean' : 0x74,// t
		'Signed 8-bit' : 0x62,// b
		// 'Unsigned 8-bit':,//
		'Signed 16-bit' : 0x73,// s
		// 'Unsigned 16-bit':,//
		'Signed 32-bit' : 0x49,// I
		// 'Unsigned 32-bit':,//
		'Signed 64-bit' : 0x6c,// l
		// 'Unsigned 64-bit':,//
		'32-bit float' : 0x66,// f
		'64-bit float' : 0x64,// d
		'Decimal' : 0x44,// D
		// 'Short string':,//
		'Long string' : 0x53,// S
		'Array' : 0x41,// A
		'Timestamp' : 0x54,// T
		'Nested Table' : 0x46,// F
		'Void' : 0x56,// V
		'Byte array' : 0x78,// x
	},
	'rabbitmq/full/amqp0-9-1.stripped' : {
		'Boolean' : 0x74,// t
		'Signed 8-bit' : 0x62,// b
		// 'Unsigned 8-bit':,//
		'Signed 16-bit' : 0x73,// s
		// 'Unsigned 16-bit':,//
		'Signed 32-bit' : 0x49,// I
		// 'Unsigned 32-bit':,//
		'Signed 64-bit' : 0x6c,// l
		// 'Unsigned 64-bit':,//
		'32-bit float' : 0x66,// f
		'64-bit float' : 0x64,// d
		'Decimal' : 0x44,// D
		// 'Short string':,//
		'Long string' : 0x53,// S
		'Array' : 0x41,// A
		'Timestamp' : 0x54,// T
		'Nested Table' : 0x46,// F
		'Void' : 0x56,// V
		'Byte array' : 0x78,// x
	},
	'rabbitmq/full/amqp0-9-1.stripped.extended' : {
		'Boolean' : 0x74,// t
		'Signed 8-bit' : 0x62,// b
		// 'Unsigned 8-bit':,//
		'Signed 16-bit' : 0x73,// s
		// 'Unsigned 16-bit':,//
		'Signed 32-bit' : 0x49,// I
		// 'Unsigned 32-bit':,//
		'Signed 64-bit' : 0x6c,// l
		// 'Unsigned 64-bit':,//
		'32-bit float' : 0x66,// f
		'64-bit float' : 0x64,// d
		'Decimal' : 0x44,// D
		// 'Short string':,//
		'Long string' : 0x53,// S
		'Array' : 0x41,// A
		'Timestamp' : 0x54,// T
		'Nested Table' : 0x46,// F
		'Void' : 0x56,// V
		'Byte array' : 0x78,// x
	}
};

module.exports = valueTypes;
