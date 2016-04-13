// json_to_jschema.js
//
// A tool to generate a jschema document from an input JSON document.
// See jschema.org for more information.

// JSchema Core Types
var CoreTypes = {
    String: "@string",
    Boolean: "@boolean",
    Date: "@date",
    URI: "@uri",
    Int: "@int",
    Number: "@number",
    Wildcard: "*",
};

// jsonToJSchema: Method for calling the JSON to JSchema transformer.
//
// Parameters:
// - json: The input JSON.
// - preferEnums: This value should be set to `true` if string arrays in the
//                input JSON should be interpreted as enums in the output JSchema.
//
function jsonToJSchema(json, preferEnums) {
    return parse(JSON.parse(json), preferEnums);
}

function parse(original, preferEnums) {
    // Never modify the original values
    var value = clone(original);

    // Try to infer the type using `typeof`
    var nativeJSType = typeof value;

    if (nativeJSType == "string") {
        // Check to see if string matches date or URI
        var isDate = !isNaN(Date.parse(value));
        var isURI = testURI(value);

        // Return appropriate type
        if (isDate) {
            return CoreTypes.Date;
        } else if (isURI) {
            return CoreTypes.URI;
        }
        return CoreTypes.String;

    } else if (nativeJSType == "number") {
        // Check if integer or float value
        return value % 1 === 0 ? CoreTypes.Int : CoreTypes.Number;

    } else if (nativeJSType == "boolean") {
        return CoreTypes.Boolean;

    } else if (nativeJSType == "object") {
        // Check if object is an array or standard object
        if (isArray(value)) {
            return parseArray(value, preferEnums);
        } else {
            return parseMember(value);
        }
    }

    return CoreTypes.Wildcard;
}

function parseArray(original, preferEnums) {
    // Never modify the original value
    var array = clone(original);

    // For empty arrays, return wildcard array
    if (array.length == 0) {
        return ["*"];
    }

    var type = undefined;
    var enumValues = {};

    // Iterate over all items, ensuring type matches
    for (var i = 0; i < array.length; i++) {
        // Return error if type doesn't match expected type
        var currentType = parse(array[i]);

        // Check type to ensure every member conforms to same type
        var commonType = commonSchema(type, currentType);
        if (type == undefined) {
            type = currentType;

            // If preferEnums is true and the array type is an object
            if (preferEnums && typeof original[i] == "object") {
                // Add the arrays for each key associated with a string to `enumValues`
                for (key in original[i]) {
                    if (currentType[key] == "@string") {
                        enumValues[key] = [];
                    }
                }
            }
        } else if (typeof original[i] == "object") {
            type = commonSchema(type, currentType);
        } else if (equal(type, currentType) == false) {
            return ["*"];
        }

        // If the array contains objects, find enum values
        if (preferEnums == true && typeof original[i] == "object") {
            // Iterate over the object's keys
            for (key in enumValues) {
                // Get the actual value and parsed type
                var currentValue = original[i][key];

                // Ensure the value doesn't already exist in the enum
                var valueExists = enumValues[key].indexOf(currentValue) > -1;

                // Add the new enum value
                if (valueExists == false) {
                    enumValues[key].push(currentValue);
                }
            }
        }
    }

    // Handle preferred enum case
    if (preferEnums) {
        for (key in enumValues) {
            type[key] = enumValues[key];
        }
    }

    return [type];
}

// Find the common key/value pairs in two schemas
function commonSchema(a, b) {
    var schema = undefined;

    // Iterate over keys in a
    for (key in a) {
        // Compare types of common keys
        if (b[key] != undefined) {
            // Schema has at least one key, so it is defined
            if (schema == undefined) {
                schema = {};
            }

            var areObjects = typeof a[key] == "object" && typeof b[key] == "object";
            var areArrays = isArray(a[key]) || isArray(b[key]);

            // Recursively add objects that are not arrays
            if (areObjects && !areArrays) {
                schema[key] = commonSchema(a[key], b[key]);
            } else if (a[key] == b[key] || areArrays) {
                // If schema types match or both schemas are arrays, add to schema
                schema[key] = a[key];
            } else {
                // Types don't match, so set type to wildcard
                schema[key] = "*";
            }
        } else {
            // Schema has at least one key, so it is defined
            if (schema == undefined) {
                schema = {};
            }
            schema[key] = a[key];
        }
    }

    // Add remaining keys from b
    for (key in b) {
        // Schema has at least one key, so it is defined
        if (schema == undefined) {
            schema = {};
        }

        // Add key if it doesn't yet exist in schema
        if (schema[key] == undefined) {
            schema[key] = b[key];
        }
    }

    return schema;
}

function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}

function parseMember(original) {
    // Never modify the original value
    var member = original;

    // Iterate over keys and replace
    for (key in member) {
        member[key] = parse(member[key]);
    }

    return member;
}

function testURI(value) {
    // http://stackoverflow.com/questions/1303872/trying-to-validate-url-using-javascript
    // https://github.com/jzaefferer/jquery-validation/blob/master/src/core.js#L1306
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test( value );
}

// EQUALITY TESTING
// Used to deep compare objects in Javascript.
// https://gist.github.com/stamat/5841593

// Returns the object's class, Array, Date, RegExp, Object are of interest to us
var getClass = function(val) {
	return Object.prototype.toString.call(val)
		.match(/^\[object\s(.*)\]$/)[1];
};

// Defines the type of the value, extended typeof
var whatis = function(val) {

	if (val === undefined)
		return 'undefined';
	if (val === null)
		return 'null';

	var type = typeof val;

	if (type === 'object')
		type = getClass(val).toLowerCase();

	if (type === 'number') {
		if (val.toString().indexOf('.') > 0)
			return 'float';
		else
			return 'integer';
	}

	return type;
};

var compareObjects = function(a, b) {
	if (a === b)
		return true;
	for (var i in a) {
		if (b.hasOwnProperty(i)) {
			if (!equal(a[i],b[i])) return false;
		} else {
			return false;
		}
	}

	for (var i in b) {
		if (!a.hasOwnProperty(i)) {
			return false;
		}
	}
	return true;
};

var compareArrays = function(a, b) {
	if (a === b)
		return true;
	if (a.length !== b.length)
		return false;
	for (var i = 0; i < a.length; i++){
		if(!equal(a[i], b[i])) return false;
	};
	return true;
};

/*
 * Are two values equal, deep compare for objects and arrays.
 * @param a {any}
 * @param b {any}
 * @return {boolean} Are equal?
 */
var equal = function(a, b) {
	if (a !== b) {
		var atype = whatis(a), btype = whatis(b);

		if (atype === btype)
			return _equal.hasOwnProperty(atype) ? _equal[atype](a, b) : a==b;

		return false;
	}

	return true;
};

var _equal = {};
_equal.array = compareArrays;
_equal.object = compareObjects;
_equal.date = function(a, b) {
	return a.getTime() === b.getTime();
};
_equal.regexp = function(a, b) {
	return a.toString() === b.toString();
};

// HELPER METHODS
function clone(object) {
    return JSON.parse(JSON.stringify(object));
}

// DEBUGGING
function formatJSONString(jsonString, preferEnums) {
    return JSON.stringify(JSON.parse(jsonString, preferEnums));
}

function jsonToJSchemaString(json, preferEnums) {
    return JSON.stringify(jsonToJSchema(json, preferEnums));
}

function testEquals(json, expectedJschema, preferEnums) {
    return equal(jsonToJSchema(json, preferEnums), JSON.parse(expectedJschema));
}
