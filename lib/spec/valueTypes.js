const rabbitmqValueTypes = {
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
const qpidValueTypes = {
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
	'ASCII character': 0x6b, // k
	'ASCII string': 0x63, // c
	'Wide string': 0x43, // C
};
const valueTypes = {
	'rabbitmq/amqp0-8.stripped': rabbitmqValueTypes,
	'rabbitmq/amqp0-9.stripped': rabbitmqValueTypes,
	'rabbitmq/amqp0-9-1.stripped': rabbitmqValueTypes,
	'rabbitmq/amqp0-9-1.stripped.extended': rabbitmqValueTypes,
	'qpid/amqp.0-10-qpid-errata.stripped': qpidValueTypes,
	'qpid/amqp.0-10.stripped': qpidValueTypes,
	'qpid/amqp0-8-qpid.stripped': qpidValueTypes,
	'qpid/amqp0-8.stripped': qpidValueTypes,
	'qpid/amqp0-9-1.stripped': qpidValueTypes,
	'qpid/amqp0-9-qpid.stripped': qpidValueTypes,
	'qpid/amqp0-9.stripped': qpidValueTypes,
	'qpid/amqp-dtx-preview.0-9': qpidValueTypes,
	'qpid/amqp-errata.0-9': qpidValueTypes,
	'qpid/amqp-nogen.0-9': qpidValueTypes,
	'qpid/apache-filters': qpidValueTypes,
	'qpid/cluster.0-8': qpidValueTypes,
};
Object.assign(module.exports, { valueTypes });
