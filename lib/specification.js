var fs = require('fs');
var util = require('util');
var xml2js = require('xml2js');
var xml2jsParser = new xml2js.Parser();
var events = require('events');
var path = require('path');

var valueTypes = require('./valueTypes');

var rootPath = path.normalize(__dirname + '/..');

var specification;
var specEmitter = new events.EventEmitter;

// TODO remove this hack and do multi spec correctly
var specRead = '';

exports.getSpecification = function(callback) {
	if (specification === undefined) {
		specEmitter.on('spec-ready', function() {
			callback(specification);
		});
	} else {
		callback(specification);
	}
};

var performLift = function(obj) {
	var ret = obj;
	for ( var i in ret.$) {
		ret[i] = ret.$[i];
	}
	delete ret.$;
	return ret;
};

var liftProperties = function(obj) {
	var ret = obj;
	if (ret.$) {
		ret = performLift(ret);
	}
	if (typeof ret === 'object') {
		for ( var i in ret) {
			ret[i] = liftProperties(ret[i]);
		}
	}
	return ret;
};

exports.selectSpecification = function(specPath, callback) {
	if (specRead) {
		if (specPath === specRead) {
			callback();
		} else {
			callback('bramqp does not support loading different specs at the same time');
		}
	} else {
		var fullSpecPath = rootPath + '/specification/' + specPath + '.xml';
		fs.readFile(fullSpecPath, function(error, data) {
			if (error) {
				return callback(error);
			}
			if (!data || data.length == 0) {
				return callback(new Error('No data in specification file'));
			}
			xml2jsParser.parseString(data, function(err, result) {
				if (err) {
					return callback(err);
				}
				specification = {};
				specification.path = specPath;
				specification.amqp = liftProperties(result.amqp);
				specification.valueTypes = valueTypes[specPath];
				specEmitter.emit('spec-ready');
				specRead = specPath;
				callback();
			});
		});
	}
};
