# Value Types

All values used in AMQP communication have types defined by the specification. When calling a method, these types are listed in the fields of the method as `domain`. Since the type of the field is already know, bramqp only requires the data. However, certain values do not have a type or `domain` specified. These values would include `properties` of `handle.content()` and the values used in an array or table. To ensure that bramqp uses the correct type, the type and the data must both be provided in an object.

The type must be a string matching one of the types available in the AMQP specification, listed in [valueTypes.js](../lib/valueTypes.js).

Example:

```javascript
'x-message-ttl': {
	type: 'Signed 32-bit',
	data: 30000
}
```
