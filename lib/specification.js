'use strict';
const fs = require('fs');
const xml2js = require('xml2js');
const xml2jsParser = new xml2js.Parser();
const path = require('path');
const valueTypes = require('./valueTypes');
const rootPath = path.normalize(__dirname + '/..');
const specCache = {};
const performLift = function(obj) {
	const ret = obj;
	for (let i in ret.$) {
		ret[i] = ret.$[i];
	}
	delete ret.$;
	return ret;
};
const liftProperties = function(obj) {
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
exports.fetchSpecification = function(specPath, callback) {
	if (specCache[specPath]) {
		setImmediate(function() {
			callback(null, specCache[specPath]);
		});
	} else {
		const fullSpecPath = rootPath + '/specification/' + specPath + '.xml';
		fs.readFile(fullSpecPath, function(error, data) {
			if (error) {
				return callback(error);
			}
			if (!data || data.length === 0) {
				return callback(new Error('No data in specification file'));
			}
			xml2jsParser.parseString(data, function(err, result) {
				if (err) {
					return callback(err);
				}
				const specification = {};
				specification.path = specPath;
				specification.amqp = liftProperties(result.amqp);
				specification.valueTypes = valueTypes[specPath];
				// Qpid adds the revision to the minor verion number
				if (specification.amqp.minor === '91') {
					specification.amqp.minor = '9';
					specification.amqp.revision = '1';
				}
				specCache[specPath] = specification;
				callback(null, specification);
			});
		});
	}
};
