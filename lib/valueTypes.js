var rabbitmqValueTypes = {
	'Boolean': 0x74, // t
	'Signed 8-bit': 0x62, // b
	'Signed 16-bit': 0x73, // s
	'Signed 32-bit': 0x49, // I
	'Signed 64-bit': 0x6c, // l
	'32-bit float': 0x66, // f
	'64-bit float': 0x64, // d
	'Decimal': 0x44, // D
	'Long string': 0x53, // S
	'Array': 0x41, // A
	'Timestamp': 0x54, // T
	'Nested Table': 0x46, // F
	'Void': 0x56, // V
	'Byte array': 0x78, // x
};
var qpidValueTypes = {
	'Boolean': 0x74, // t
	'Signed 8-bit': 0x62, // b
	'Signed 16-bit': 0x73, // s
	'Signed 32-bit': 0x49, // I
	'Unsigned 32-bit': 0x69, // i
	'Signed 64-bit': 0x6c, // l
	'32-bit float': 0x66, // f
	'64-bit float': 0x64, // d
	'Decimal': 0x44, // D
	'Long string': 0x53, // S
	'Array': 0x41, // A
	'Timestamp': 0x54, // T
	'Nested Table': 0x46, // F
	'Void': 0x56, // V
	'Byte array': 0x78, // x
	//TODO support these types
	//ASCII_STRING('c')
	//WIDE_STRING('C')
	//ASCII_CHARACTER('k')
};
var valueTypes = {
	'rabbitmq/full/amqp0-8.stripped': rabbitmqValueTypes,
	'rabbitmq/full/amqp0-9.stripped': rabbitmqValueTypes,
	'rabbitmq/full/amqp0-9-1.stripped': rabbitmqValueTypes,
	'rabbitmq/full/amqp0-9-1.stripped.extended': rabbitmqValueTypes,
	'qpid/specs/amqp.0-10-qpid-errata.stripped': qpidValueTypes,
	'qpid/specs/amqp.0-10.stripped': qpidValueTypes,
	'qpid/specs/amqp0-8-qpid.stripped': qpidValueTypes,
	'qpid/specs/amqp0-8.stripped': qpidValueTypes,
	'qpid/specs/amqp0-9-1.stripped': qpidValueTypes,
	'qpid/specs/amqp0-9-qpid.stripped': qpidValueTypes,
	'qpid/specs/amqp0-9.stripped': qpidValueTypes,
	'qpid/specs/amqp-dtx-preview.0-9': qpidValueTypes,
	'qpid/specs/amqp-errata.0-9': qpidValueTypes,
	'qpid/specs/amqp-nogen.0-9': qpidValueTypes,
	'qpid/specs/apache-filters': qpidValueTypes,
	'qpid/specs/cluster.0-8': qpidValueTypes,
};
module.exports = valueTypes;
