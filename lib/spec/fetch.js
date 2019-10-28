'use strict';
const util = require('util');
const path = require('path');
const fs = require('fs');
const readFile = util.promisify(fs.readFile).bind(fs);
const xml2js = require('xml2js');
const xml2jsParser = new xml2js.Parser();
const parseString = util.promisify(xml2jsParser.parseString).bind(xml2jsParser);
const { valueTypes } = require('./valueTypes');
const rootPath = path.normalize(__dirname + '/../..');
const specCache = {};
const performLift = (obj) => {
	const ret = obj;
	for (let i in ret.$) {
		ret[i] = ret.$[i];
	}
	delete ret.$;
	return ret;
};
const liftProperties = (obj) => {
	let ret = obj;
	if (ret.$) {
		ret = performLift(ret);
	}
	if (typeof ret === 'object') {
		for (let i in ret) {
			ret[i] = liftProperties(ret[i]);
		}
	}
	return ret;
};
const fetchSpecification = async(specPath) => {
	if (!specCache[specPath]) {
		const fullSpecPath = rootPath + '/specification/' + specPath + '.xml';
		let data = await readFile(fullSpecPath);
		if (!data || data.length === 0) {
			throw new Error('No data in specification file');
		}
		let result = await parseString(data);
		specCache[specPath] = {};
		specCache[specPath].path = specPath;
		specCache[specPath].amqp = liftProperties(result.amqp);
		specCache[specPath].valueTypes = valueTypes[specPath];
		specCache[specPath].classes = {};
		for (let theClass of specCache[specPath].amqp['class']) {
			specCache[specPath].classes[theClass.name] = theClass;
			for (let method of theClass.method) {
				specCache[specPath].classes[theClass.name][method.name] = method;
			}
		}
		// Qpid adds the revision to the minor verion number
		if (specCache[specPath].amqp.minor === '91') {
			specCache[specPath].amqp.minor = '9';
			specCache[specPath].amqp.revision = '1';
		}
	}
	return specCache[specPath];
};
Object.assign(module.exports, { fetchSpecification });
